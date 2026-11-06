package com.fitnessassist.service.data;

import com.fitnessassist.exception.BadRequestException;
import com.fitnessassist.exception.ConflictException;
import com.fitnessassist.exception.FieldValidationException;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.service.data.FieldDef.Type;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.PersistenceException;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Generic create/read/update/delete over every table registered in {@link DataResources}.
 * Values are converted and validated against each field's definition, so bad input comes
 * back as a 400 with per-field messages and constraint clashes as a readable 409.
 */
@Service
@RequiredArgsConstructor
public class AdminDataService {

    private static final Set<String> RESERVED_PARAMS = Set.of("page", "size", "q", "sort", "dir");
    private static final int MAX_PAGE = 100;

    @PersistenceContext
    private EntityManager em;

    private final DataResources resources;
    private final PasswordEncoder passwordEncoder;

    public record TableInfo(String key, String label, String group, String description, long count,
                            List<FieldDef> fields) {
    }

    public record Page(List<Map<String, Object>> rows, long total, int page, int size) {
    }

    public record Option(Long id, String label) {
    }

    /* ----------------------------------------------------------------- reads */

    @Transactional(readOnly = true)
    public List<TableInfo> tables() {
        return resources.all().stream()
                .map(r -> new TableInfo(r.getKey(), r.getLabel(), r.getGroup(), r.getDescription(),
                        count(r, null, Map.of()), r.getFields()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page list(String key, int page, int size, String q, String sort, String dir, Map<String, String> params) {
        Resource r = resources.get(key);
        int pageSize = Math.max(1, Math.min(size, MAX_PAGE));
        int pageNo = Math.max(0, page);
        Map<String, String> filters = filters(params);

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Object> cq = cb.createQuery();
        Root<?> root = cq.from(r.getEntity());
        // Fetch references in the same query so labels don't cost one query per row.
        r.getFields().stream().filter(f -> f.getType() == Type.REF).forEach(f -> root.fetch(f.getName(), JoinType.LEFT));
        cq.select(root).where(predicates(cb, root, r, q, filters));

        boolean asc = "asc".equalsIgnoreCase(dir);
        FieldDef sortField = sort == null ? null : r.field(sort);
        Path<?> sortPath = sortField != null && sortField.getType() != Type.REF && sortField.getType() != Type.PASSWORD
                ? root.get(sortField.getName()) : root.get("id");
        cq.orderBy(asc ? cb.asc(sortPath) : cb.desc(sortPath));

        List<Object> found = em.createQuery(cq).setFirstResult(pageNo * pageSize).setMaxResults(pageSize).getResultList();
        List<Map<String, Object>> rows = found.stream().map(e -> toRow(r, e)).toList();
        return new Page(rows, count(r, q, filters), pageNo, pageSize);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(String key, Long id) {
        Resource r = resources.get(key);
        return toRow(r, find(r, id));
    }

    /** Small id/label list for choosing a referenced row in a form. */
    @Transactional(readOnly = true)
    public List<Option> options(String key, String q) {
        Resource r = resources.get(key);
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Object> cq = cb.createQuery();
        Root<?> root = cq.from(r.getEntity());
        cq.select(root).where(predicates(cb, root, r, q, Map.of())).orderBy(cb.desc(root.get("id")));
        return em.createQuery(cq).setMaxResults(30).getResultList().stream()
                .map(e -> new Option(id(e), r.getLabeler().apply(e))).toList();
    }

    /* ---------------------------------------------------------------- writes */

    @Transactional
    public Map<String, Object> create(String key, Map<String, Object> body) {
        Resource r = resources.get(key);
        Object entity;
        try {
            var ctor = r.getEntity().getDeclaredConstructor();
            ctor.setAccessible(true);
            entity = ctor.newInstance();
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Cannot create " + r.getEntity().getSimpleName(), e);
        }
        apply(r, entity, body, true);
        r.getBeforeSave().accept(entity, true);
        // IDENTITY ids make Hibernate insert on persist, so constraint errors can surface here too.
        translate("save", () -> em.persist(entity));
        flush("save");
        r.getAfterChange().accept(entity, false);
        flush("save");
        return toRow(r, entity);
    }

    @Transactional
    public Map<String, Object> update(String key, Long id, Map<String, Object> body) {
        Resource r = resources.get(key);
        Object entity = find(r, id);
        apply(r, entity, body, false);
        r.getBeforeSave().accept(entity, false);
        flush("save");
        r.getAfterChange().accept(entity, false);
        flush("save");
        return toRow(r, entity);
    }

    @Transactional
    public void delete(String key, Long id) {
        Resource r = resources.get(key);
        Object entity = find(r, id);
        if (r.getDeleter() != null) {
            translate("delete", () -> r.getDeleter().accept(entity));
        } else {
            em.remove(entity);
        }
        flush("delete");
        r.getAfterChange().accept(entity, true);
        flush("delete");
    }

    /* ------------------------------------------------------------- internals */

    private Object find(Resource r, Long id) {
        Object e = em.find(r.getEntity(), id);
        if (e == null) {
            throw new ResourceNotFoundException(r.getLabel() + " #" + id + " not found");
        }
        return e;
    }

    private long count(Resource r, String q, Map<String, String> filters) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<?> root = cq.from(r.getEntity());
        cq.select(cb.count(root)).where(predicates(cb, root, r, q, filters));
        return em.createQuery(cq).getSingleResult();
    }

    /** Query parameters other than paging/sorting are treated as column filters, e.g. ?user=5&mealType=LUNCH. */
    private static Map<String, String> filters(Map<String, String> params) {
        Map<String, String> out = new LinkedHashMap<>();
        params.forEach((k, v) -> {
            if (!RESERVED_PARAMS.contains(k) && v != null && !v.isBlank()) out.put(k, v.trim());
        });
        return out;
    }

    private Predicate[] predicates(CriteriaBuilder cb, Root<?> root, Resource r, String q, Map<String, String> filters) {
        List<Predicate> and = new ArrayList<>();

        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            List<Predicate> or = new ArrayList<>();
            for (FieldDef f : r.getFields()) {
                if (f.getType() == Type.STRING || f.getType() == Type.TEXT) {
                    or.add(cb.like(cb.lower(root.get(f.getName())), like));
                }
            }
            parseLong(q.trim()).ifPresent(n -> or.add(cb.equal(root.get("id"), n)));
            and.add(or.isEmpty() ? cb.disjunction() : cb.or(or.toArray(Predicate[]::new)));
        }

        filters.forEach((name, raw) -> {
            FieldDef f = r.field(name);
            if (f == null) {
                throw new BadRequestException("Unknown filter: " + name);
            }
            Object value = switch (f.getType()) {
                case REF -> parseLong(raw).orElseThrow(() -> new BadRequestException(name + " must be an id"));
                case ENUM -> enumValue(r, f, raw);
                case BOOLEAN -> Boolean.parseBoolean(raw);
                default -> throw new BadRequestException("Cannot filter on " + name);
            };
            and.add(f.getType() == Type.REF
                    ? cb.equal(root.get(name).get("id"), value)
                    : cb.equal(root.get(name), value));
        });
        return and.toArray(Predicate[]::new);
    }

    private void apply(Resource r, Object entity, Map<String, Object> body, boolean create) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldDef f : r.getFields()) {
            if (f.isReadOnly() || (f.isCreateOnly() && !create) || !body.containsKey(f.getName())) {
                continue;
            }
            Object raw = body.get(f.getName());
            try {
                if (f.getType() == Type.PASSWORD) {
                    String pw = raw == null ? "" : raw.toString();
                    if (pw.isBlank()) continue; // blank means "keep the current one"
                    if (pw.length() < 8) throw new IllegalArgumentException("must be at least 8 characters");
                    EntityAccess.write(entity, f.getName(), passwordEncoder.encode(pw));
                    continue;
                }
                Object value = convert(r, f, raw);
                Class<?> javaType = EntityAccess.typeOf(r.getEntity(), f.getName());
                if (value == null && javaType.isPrimitive()) {
                    throw new IllegalArgumentException("is required");
                }
                EntityAccess.write(entity, f.getName(), value);
            } catch (IllegalArgumentException | DateTimeParseException e) {
                errors.put(f.getName(), f.getLabel() + " " + friendly(e));
            }
        }

        // Required checks run on the final entity so defaults and existing values count.
        for (FieldDef f : r.getFields()) {
            if (errors.containsKey(f.getName())) continue;
            if (f.getType() == Type.PASSWORD) {
                if (create && blank(EntityAccess.read(entity, f.getName()))) {
                    errors.put(f.getName(), f.getLabel() + " is required");
                }
                continue;
            }
            if (f.isRequired() && !f.isReadOnly() && blank(EntityAccess.read(entity, f.getName()))) {
                errors.put(f.getName(), f.getLabel() + " is required");
            }
        }
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }
    }

    private Object convert(Resource r, FieldDef f, Object raw) {
        if (raw == null || (raw instanceof String s && s.isBlank())) {
            return f.getType() == Type.BOOLEAN ? Boolean.FALSE : null;
        }
        String s = raw.toString().trim();
        return switch (f.getType()) {
            case STRING, TEXT -> {
                if (f.getMaxLength() != null && s.length() > f.getMaxLength()) {
                    throw new IllegalArgumentException("can be at most " + f.getMaxLength() + " characters");
                }
                yield s;
            }
            case INT -> {
                double d = number(raw);
                if (d != Math.rint(d)) throw new IllegalArgumentException("must be a whole number");
                checkRange(f, d);
                yield (int) d;
            }
            case DECIMAL -> {
                double d = number(raw);
                checkRange(f, d);
                yield d;
            }
            case BOOLEAN -> raw instanceof Boolean b ? b : Boolean.parseBoolean(s);
            case DATE -> LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
            case DATETIME -> LocalDateTime.parse(s.length() == 16 ? s + ":00" : s);
            case ENUM -> enumValue(r, f, s);
            case REF -> {
                Resource target = resources.get(f.getRef());
                Long refId = parseLong(s).orElseThrow(() -> new IllegalArgumentException("must be an id"));
                Object ref = em.find(target.getEntity(), refId);
                if (ref == null) throw new IllegalArgumentException("#" + refId + " does not exist");
                yield ref;
            }
            case PASSWORD -> throw new IllegalStateException("handled separately");
        };
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static Object enumValue(Resource r, FieldDef f, String raw) {
        Class<? extends Enum> type = (Class<? extends Enum>) EntityAccess.typeOf(r.getEntity(), f.getName());
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("must be one of " + String.join(", ", f.getOptions()));
        }
    }

    private static double number(Object raw) {
        if (raw instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(raw.toString().trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("must be a number");
        }
    }

    private static void checkRange(FieldDef f, double d) {
        if (f.getMin() != null && d < f.getMin()) throw new IllegalArgumentException("must be at least " + fmt(f.getMin()));
        if (f.getMax() != null && d > f.getMax()) throw new IllegalArgumentException("must be at most " + fmt(f.getMax()));
    }

    private Map<String, Object> toRow(Resource r, Object entity) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id(entity));
        for (FieldDef f : r.getFields()) {
            if (f.getType() == Type.PASSWORD) continue;
            Object v = EntityAccess.read(entity, f.getName());
            if (f.getType() == Type.REF && v != null) {
                Resource target = resources.get(f.getRef());
                v = Map.of("id", id(v), "label", target.getLabeler().apply(v));
            }
            row.put(f.getName(), v);
        }
        row.put("_label", r.getLabeler().apply(entity));
        return row;
    }

    private Long id(Object entity) {
        return (Long) em.getEntityManagerFactory().getPersistenceUnitUtil().getIdentifier(entity);
    }

    /** Pushes pending SQL now so constraint violations surface here as a clear 409. */
    private void flush(String action) {
        translate(action, em::flush);
    }

    private void translate(String action, Runnable work) {
        try {
            work.run();
        } catch (PersistenceException | DataIntegrityViolationException e) {
            String msg = rootMessage(e).toLowerCase();
            if (msg.contains("foreign key") || msg.contains("cannot delete or update a parent row")) {
                throw new ConflictException("Cannot " + action + ": other records still reference this row. "
                        + "Delete or reassign those first.");
            }
            if (msg.contains("duplicate")) {
                throw new ConflictException("Cannot " + action + ": a record with the same unique value already exists "
                        + "(for example the same email, exercise name, or a second entry for the same user and day).");
            }
            throw new ConflictException("Cannot " + action + ": the database rejected the change (" + rootMessage(e) + ")");
        }
    }

    private static String rootMessage(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null && t.getCause() != t) t = t.getCause();
        return String.valueOf(t.getMessage());
    }

    private static String friendly(Exception e) {
        return e instanceof DateTimeParseException ? "is not a valid date/time" : e.getMessage();
    }

    private static boolean blank(Object v) {
        return v == null || (v instanceof String s && s.isBlank());
    }

    private static Optional<Long> parseLong(String s) {
        try {
            return Optional.of(Long.parseLong(s));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private static String fmt(double d) {
        return d == Math.rint(d) ? String.valueOf((long) d) : String.valueOf(d);
    }
}

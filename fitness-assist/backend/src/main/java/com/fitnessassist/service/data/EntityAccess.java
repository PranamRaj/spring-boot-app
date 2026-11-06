package com.fitnessassist.service.data;

import org.hibernate.Hibernate;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Field-level access to entities by name. Field access (rather than getters) sidesteps
 * Lombok/bean-naming quirks, and unproxying makes it safe on lazily loaded references.
 */
final class EntityAccess {

    private static final Map<String, Field> CACHE = new ConcurrentHashMap<>();

    private EntityAccess() {
    }

    static Object read(Object entity, String name) {
        if (entity == null) return null;
        Object target = Hibernate.unproxy(entity);
        try {
            return field(target.getClass(), name).get(target);
        } catch (IllegalAccessException e) {
            throw new IllegalStateException(e);
        }
    }

    static void write(Object entity, String name, Object value) {
        Object target = Hibernate.unproxy(entity);
        try {
            field(target.getClass(), name).set(target, value);
        } catch (IllegalAccessException e) {
            throw new IllegalStateException(e);
        }
    }

    static Class<?> typeOf(Class<?> type, String name) {
        return field(type, name).getType();
    }

    private static Field field(Class<?> type, String name) {
        return CACHE.computeIfAbsent(type.getName() + "#" + name, k -> {
            for (Class<?> c = type; c != null && c != Object.class; c = c.getSuperclass()) {
                try {
                    Field f = c.getDeclaredField(name);
                    f.setAccessible(true);
                    return f;
                } catch (NoSuchFieldException ignored) {
                    // keep walking up the hierarchy
                }
            }
            throw new IllegalArgumentException("No field " + name + " on " + type.getSimpleName());
        });
    }
}

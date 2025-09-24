# 📌 Pruebas en Postman para la API RRHH

## 🔹 **1. Login**
**Método:** `POST`
**URL:** `http://localhost:5000/api/auth/login`
**Cuerpo (JSON):**
```json
{
  "email": "juan.perez@email.com",
  "password": "12345678"
}
```
**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "usuario": {
    "id": 1,
    "email": "juan.perez@email.com"
  }
}
```

---

## 🔹 **2. Crear un usuario**
**Método:** `POST`
**URL:** `http://localhost:5000/api/usuarios`
**Cuerpo (JSON):**
```json
{
  "nombres": "Carlos López",
  "email": "carlos.lopez@email.com",
  "documento": "222222",
  "codigo": "222222",
  "fecha_ingreso": "2024-01-01",
  "tipo_contrato": "Indefinido",
  "password": "claveSegura123"
}

```
**Respuesta esperada:**
```json
{
    "message": "Empleado y usuario creados exitosamente",
    "empleado": {
        "id": 4,
        "nombres": "Carlos López",
        "email": "carlos.lopez@email.com",
        "documento": "222222",
        "fecha_ingreso": "2024-01-01T00:00:00.000Z",
        "codigo": "222222"
    },
    "usuario": {
        "id": 5,
        "email": "carlos.lopez@email.com",
        "password": "$2b$10$MrNwOjknOe/02fw1AJd0MeAiVh9l4/vwypeG47WoqRANFkgTUcyty",
        "empleado_id": 4
    }
}
```

---

## 🔹 **3. Editar un usuario**
**Método:** `PUT`
**URL:** `http://localhost:5000/api/usuarios/1`
**Cuerpo (JSON):**
```json
{
  "email": "actualizado@email.com",
  "password": "nuevaclave"
}
```
**Respuesta esperada:**
```json
{
  "message": "Usuario actualizado exitosamente",
  "usuario": {
    "id": 1,
    "email": "actualizado@email.com"
  }
}
```

---

## 🔹 **4. Deshabilitar un usuario (establecer fecha de salida)**
**Método:** `PUT`
**URL:** `http://localhost:5000/api/usuarios/deshabilitar/1`
**Cuerpo (JSON):**
```json
{
  "fecha_salida": "2025-01-01"
}
```
**Respuesta esperada:**
```json
{
  "message": "Empleado deshabilitado exitosamente",
  "empleado": {
    "id": 1,
    "fecha_salida": "2025-01-01"
  }
}
```

---

📌 **Nota:** Recuerda agregar el token en el header `Authorization` para las pruebas protegidas. 🚀

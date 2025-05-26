CREATE DATABASE IF NOT EXISTS peluqueria;
USE peluqueria;

-- Tabla Usuarios (Base para Clientes y Peluqueros)
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    sexo ENUM('Hombre', 'Mujer') NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Clientes (Hereda de Usuarios)
CREATE TABLE Clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Tabla Peluqueros (Hereda de Usuarios)
CREATE TABLE Peluqueros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE,
    especialidad VARCHAR(100) NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fin TIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Tabla Citas (Asocia Clientes y Peluqueros)
CREATE TABLE Citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    peluquero_id INT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada') DEFAULT 'pendiente',
    FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (peluquero_id) REFERENCES Peluqueros(id) ON DELETE CASCADE
);



-- Insertar datos de prueba en Usuarios
INSERT INTO Usuarios (nombre, email, contrasena, telefono, sexo) VALUES
('Admin', 'admin@peluqueria.com', 'admin123', '1234567890', 'Hombre'),
('Juan Pérez', 'juan@correo.com', 'password1', '9876543210', 'Hombre'),
('María López', 'maria@correo.com', 'password2', '8765432109', 'Mujer'),
('Carlos Gómez', 'carlos@correo.com', 'password3', '7654321098', 'Hombre');

-- Insertar datos de prueba en Clientes
INSERT INTO Clientes (usuario_id) VALUES (2), (3);

-- Insertar datos de prueba en Peluqueros
INSERT INTO Peluqueros (usuario_id, especialidad, horario_inicio, horario_fin) VALUES
(4, 'Corte de cabello', '09:00:00', '18:00:00');

-- Insertar datos de prueba en Citas
INSERT INTO Citas (cliente_id, peluquero_id, fecha, hora, estado) VALUES
(1, 1, '2024-07-01', '10:00:00', 'confirmada'),
(2, 1, '2024-07-02', '14:00:00', 'pendiente');


const departamento = require('../../models/EstructuraEmpresa/Departamento');
const Empleado = require('../../models/Empleado');

const obtenerDepartamentos = async (req, res) => {
    try {
        const departamentos = await departamento.findAll({
            include: [
                {
                    model: Empleado,
                    as: 'gerente',
                    attributes: ['id', 'nombres', 'documento', 'email']
                }
            ]
        });
        res.json(departamentos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener departamentos', error });
    }
};

const actualizarDepartamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, gerente_id } = req.body;
        const dep = await departamento.findByPk(id);
        if (!dep) return res.status(404).json({ message: 'Departamento no encontrado' });
        dep.nombre = nombre;
        dep.gerente_id = gerente_id;
        await dep.save();
        res.json(dep);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar departamento', error });
    }
};

const crearDepartamento = async (req, res) => {
    try {
        const { nombre, gerente_id } = req.body;
        const nuevo = await departamento.create({ nombre, gerente_id: gerente_id || null });
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear departamento', error });
    }
};

const eliminarDepartamento = async (req, res) => {
    try {
        const { id } = req.params;
        const departamentoObj = await departamento.findByPk(id);
        
        if (!departamentoObj) {
            return res.status(404).json({ message: 'Departamento no encontrado' });
        }
        
        // Verificar si el departamento tiene áreas asociadas
        const Area = require('../../models/EstructuraEmpresa/Area');
        const areasAsociadas = await Area.findAll({ where: { departamento_id: id } });
        
        if (areasAsociadas.length > 0) {
            return res.status(400).json({ 
                message: `No se puede eliminar el departamento porque tiene ${areasAsociadas.length} área(s) asociada(s). Elimine las áreas primero.` 
            });
        }
        
        await departamentoObj.destroy();
        res.json({ message: 'Departamento eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar departamento:', error);
        res.status(500).json({ message: 'Error al eliminar departamento', error: error.message });
    }
};

module.exports = { obtenerDepartamentos, actualizarDepartamento, crearDepartamento, eliminarDepartamento };

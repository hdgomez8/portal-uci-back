const area = require('../../models/EstructuraEmpresa/Area');
const Empleado = require('../../models/Empleado');
const Departamento = require('../../models/EstructuraEmpresa/Departamento');

const obtenerAreas = async (req, res) => {
    try {
        const areas = await area.findAll({
            include: [
                {
                    model: Empleado,
                    as: 'jefe',
                    attributes: ['id', 'nombres', 'documento', 'email']
                },
                {
                    model: Departamento,
                    as: 'departamento',
                    attributes: ['id', 'nombre']
                }
            ]
        });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener areas', error });
    }
};

const actualizarArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, departamento_id, jefe_id } = req.body;
        
        const areaObj = await area.findByPk(id);
        if (!areaObj) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        
        // Validar que el nombre del área sea único (excluyendo el área actual)
        const areaExistente = await area.findOne({
            where: { 
                nombre: nombre,
                departamento_id: departamento_id,
                id: { [require('sequelize').Op.ne]: id } // Excluir el área actual
            }
        });
        
        if (areaExistente) {
            return res.status(400).json({ 
                message: `Ya existe un área con el nombre "${nombre}" en este departamento. Los nombres de áreas deben ser únicos dentro del mismo departamento.` 
            });
        }
        
        // Obtener el jefe del departamento automáticamente
        const Departamento = require('../../models/EstructuraEmpresa/Departamento');
        const departamento = await Departamento.findByPk(departamento_id);
        
        if (!departamento) {
            return res.status(404).json({ 
                message: 'Departamento no encontrado' 
            });
        }
        
        // El jefe del área será el mismo que el gerente del departamento
        const jefeArea = departamento.gerente_id;
        
        areaObj.nombre = nombre;
        areaObj.departamento_id = departamento_id;
        areaObj.jefe_id = jefeArea;
        await areaObj.save();
        
        res.json({
            ...areaObj.toJSON(),
            jefe_automatico: true,
            mensaje: 'El jefe del área se ha actualizado automáticamente como el gerente del departamento'
        });
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({ message: 'Error al actualizar área', error: error.message });
    }
};

const crearArea = async (req, res) => {
    try {
        const { nombre, departamento_id, jefe_id } = req.body;
        
        // Validar que el nombre del área sea único
        const areaExistente = await area.findOne({
            where: { 
                nombre: nombre,
                departamento_id: departamento_id 
            }
        });
        
        if (areaExistente) {
            return res.status(400).json({ 
                message: `Ya existe un área con el nombre "${nombre}" en este departamento. Los nombres de áreas deben ser únicos dentro del mismo departamento.` 
            });
        }
        
        // Obtener el jefe del departamento automáticamente
        const Departamento = require('../../models/EstructuraEmpresa/Departamento');
        const departamento = await Departamento.findByPk(departamento_id);
        
        if (!departamento) {
            return res.status(404).json({ 
                message: 'Departamento no encontrado' 
            });
        }
        
        // El jefe del área será el mismo que el gerente del departamento
        const jefeArea = departamento.gerente_id;
        
        const nuevaArea = await area.create({
            nombre,
            departamento_id,
            jefe_id: jefeArea
        });
        
        res.status(201).json({
            ...nuevaArea.toJSON(),
            jefe_automatico: true,
            mensaje: 'El jefe del área se ha asignado automáticamente como el gerente del departamento'
        });
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({ message: 'Error al crear área', error: error.message });
    }
};

const eliminarArea = async (req, res) => {
    try {
        const { id } = req.params;
        const areaObj = await area.findByPk(id);
        
        if (!areaObj) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        
        // Verificar si el área tiene empleados asociados
        const EmpleadoArea = require('../../models/EstructuraEmpresa/EmpleadosAreas');
        const empleadosAsociados = await EmpleadoArea.findAll({ where: { area_id: id } });
        
        if (empleadosAsociados.length > 0) {
            return res.status(400).json({ 
                message: `No se puede eliminar el área porque tiene ${empleadosAsociados.length} empleado(s) asociado(s). Reasigne los empleados primero.` 
            });
        }
        
        await areaObj.destroy();
        res.json({ message: 'Área eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({ message: 'Error al eliminar área', error: error.message });
    }
};

module.exports = { obtenerAreas, actualizarArea, crearArea, eliminarArea };

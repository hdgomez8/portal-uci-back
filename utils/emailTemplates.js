const fs = require('fs');
const path = require('path');

// Función para convertir imagen a base64
const getLogoBase64 = () => {
  try {
    const logoPath = path.join(__dirname, '..', 'logo_empresa.png');
    if (fs.existsSync(logoPath)) {
      const imageBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }
    return null;
  } catch (error) {
    console.error('Error leyendo logo:', error);
    return null;
  }
};

// Plantilla base con estilos CSS inline
const getBaseTemplate = (content) => {
  const logoBase64 = getLogoBase64();
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal UCI - Notificación</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header con logo -->
        <div style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); padding: 30px 20px; text-align: center;">
          ${logoBase64 ? `
            <img src="${logoBase64}" alt="Portal UCI" style="height: 60px; margin-bottom: 15px;">
          ` : `
            <div style="font-size: 48px; margin-bottom: 15px;">📧</div>
          `}
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Portal UCI</h1>
          <p style="color: #e8f5e8; margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión de Recursos Humanos</p>
        </div>
        
        <!-- Contenido principal -->
        <div style="padding: 40px 30px;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
          <div style="text-align: center; color: #6c757d; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
              <strong>Portal UCI</strong> - Sistema de Gestión de RRHH
            </p>
            <p style="margin: 0; font-size: 12px;">
              Este es un correo automático del sistema. No es necesario responder.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} Portal UCI. Todos los derechos reservados.
            </p>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Plantilla para permiso aprobado
const getPermisoAprobadoTemplate = (empleado, solicitud, jefe) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #155724; margin: 0; font-size: 24px; font-weight: 600;">
          Permiso Aprobado
        </h2>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud ha sido aprobada exitosamente
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Tu solicitud de permiso ha sido <strong>APROBADA</strong> por tu jefe inmediato.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        Detalles del Permiso
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Tipo de Permiso</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.tipo_solicitud?.nombre || 'No especificado'}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Permiso</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Hora</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.hora}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Duración</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.duracion} horas</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        👤 Aprobado por
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px;">
        <strong>${jefe?.nombres || 'Jefe Inmediato'}</strong>
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Adjunto encontrarás el <strong>PDF oficial</strong> del permiso aprobado.
      </p>
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          📄 <strong>Importante:</strong> Conserva este documento para tus registros.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para permiso rechazado
const getPermisoRechazadoTemplate = (empleado, solicitud, motivo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #721c24; margin: 0; font-size: 24px; font-weight: 600;">
          ❌ Permiso Rechazado
        </h2>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud ha sido rechazada
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Tu solicitud de permiso ha sido <strong>RECHAZADA</strong> por tu jefe inmediato.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #721c24; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        Detalles del Permiso
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Tipo de Permiso</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.tipo_solicitud?.nombre || 'No especificado'}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Permiso</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Hora</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.hora}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Duración</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.duracion} horas</p>
        </div>
      </div>
    </div>
    
    ${motivo ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          📝 Motivo del Rechazo
        </h4>
        <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.6;">
          ${motivo}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        💡 Próximos Pasos
      </h4>
      <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
        Si tienes alguna duda sobre esta decisión, por favor contacta a tu jefe inmediato para aclarar los detalles.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para nueva solicitud (notificación al jefe)
const getNuevaSolicitudTemplate = (empleado, jefe) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #0c5460; margin: 0; font-size: 24px; font-weight: 600;">
          📋 Nueva Solicitud Pendiente
        </h2>
        <p style="color: #0c5460; margin: 10px 0 0 0; font-size: 16px;">
          Tienes una nueva solicitud para revisar
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${jefe.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        El empleado <strong>${empleado.nombres}</strong> ha creado una nueva solicitud que requiere tu revisión.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        👤 Información del Empleado
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Nombre</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Cargo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.oficio || 'No especificado'}</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        ⚡ Acción Requerida
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Por favor, ingresa al sistema Portal UCI para revisar y procesar esta solicitud lo antes posible.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para cambio de turno - notificación al reemplazo
const getCambioTurnoVistoBuenoTemplate = (empleadoReemplazo, solicitud, empleadoSolicitante) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          🔄 Solicitud de Cambio de Turno
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Requiere tu visto bueno
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleadoReemplazo.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        El empleado <strong>${empleadoSolicitante.nombres}</strong> ha solicitado un cambio de turno y te ha designado como reemplazo.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Motivo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.motivo || 'No especificado'}</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        ⚡ Acción Requerida
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Por favor, ingresa al sistema Portal UCI para revisar y dar tu visto bueno a esta solicitud de cambio de turno.
      </p>
    </div>
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        📝 Información Adicional
      </h4>
      <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
        Afectación a nómina: <strong>${solicitud.afectacion_nomina || 'No'}</strong><br>
        Observaciones: ${solicitud.observaciones || 'Ninguna'}
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para cambio de turno aprobado por jefe
const getCambioTurnoAprobadoTemplate = (empleado, solicitud, jefe) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #155724; margin: 0; font-size: 24px; font-weight: 600;">
          ✅ Cambio de Turno Aprobado
        </h2>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud ha sido aprobada exitosamente
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Tu solicitud de cambio de turno ha sido <strong>APROBADA</strong> por tu jefe inmediato.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.nombre_reemplazo}</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        👤 Aprobado por
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px;">
        <strong>${jefe?.nombres || 'Jefe Inmediato'}</strong>
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Tu cambio de turno ha sido <strong>confirmado</strong> y está listo para ejecutarse.
      </p>
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          📅 <strong>Importante:</strong> Coordina con tu reemplazo para el cambio de turno.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para cambio de turno rechazado por jefe
const getCambioTurnoRechazadoTemplate = (empleado, solicitud, motivo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #721c24; margin: 0; font-size: 24px; font-weight: 600;">
          ❌ Cambio de Turno Rechazado
        </h2>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud ha sido rechazada
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Tu solicitud de cambio de turno ha sido <strong>RECHAZADA</strong> por tu jefe inmediato.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #721c24; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.nombre_reemplazo}</p>
        </div>
      </div>
    </div>
    
    ${motivo ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          📝 Motivo del Rechazo
        </h4>
        <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.6;">
          ${motivo}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        💡 Próximos Pasos
      </h4>
      <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
        Si tienes alguna duda sobre esta decisión, por favor contacta a tu jefe inmediato para aclarar los detalles.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para notificación de visto bueno aprobado
const getVistoBuenoAprobadoTemplate = (empleadoSolicitante, solicitud, empleadoReemplazo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #155724; margin: 0; font-size: 24px; font-weight: 600;">
          ✅ Visto Bueno Aprobado
        </h2>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 16px;">
          Tu reemplazo ha dado visto bueno al cambio de turno
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleadoSolicitante.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        <strong>${empleadoReemplazo.nombres}</strong> ha dado su <strong>VISTO BUENO</strong> a tu solicitud de cambio de turno.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleadoReemplazo.nombres}</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        📋 Estado Actual
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Tu solicitud está ahora en <strong>"En Revisión"</strong> esperando la aprobación final de tu jefe inmediato.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para notificación de visto bueno rechazado
const getVistoBuenoRechazadoTemplate = (empleadoSolicitante, solicitud, empleadoReemplazo, motivo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #721c24; margin: 0; font-size: 24px; font-weight: 600;">
          ❌ Visto Bueno Rechazado
        </h2>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 16px;">
          Tu reemplazo ha rechazado el cambio de turno
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleadoSolicitante.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        <strong>${empleadoReemplazo.nombres}</strong> ha <strong>RECHAZADO</strong> tu solicitud de cambio de turno.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #721c24; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleadoReemplazo.nombres}</p>
        </div>
      </div>
    </div>
    
    ${motivo ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          📝 Motivo del Rechazo
        </h4>
        <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.6;">
          ${motivo}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        💡 Próximos Pasos
      </h4>
      <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
        Te recomendamos contactar a ${empleadoReemplazo.nombres} para coordinar una nueva fecha o buscar otro reemplazo.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para notificación al reemplazo cuando se aprueba por jefe
const getReemplazoAprobadoTemplate = (empleadoReemplazo, solicitud, empleadoSolicitante, jefe) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #155724; margin: 0; font-size: 24px; font-weight: 600;">
          ✅ Cambio de Turno Confirmado
        </h2>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 16px;">
          El cambio de turno ha sido aprobado por el jefe
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleadoReemplazo.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        La solicitud de cambio de turno en la que eres el <strong>reemplazo</strong> ha sido <strong>APROBADA</strong> por el jefe de área.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Solicitante</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleadoSolicitante.nombres}</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        👤 Aprobado por
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px;">
        <strong>${jefe?.nombres || 'Jefe de Área'}</strong>
      </p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        ⚡ Acción Requerida
      </h4>
      <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.6;">
        Por favor, asegúrate de estar disponible para el cambio de turno en la fecha y horario especificados.
        Coordina con ${empleadoSolicitante.nombres} para confirmar los detalles.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para notificar al jefe sobre cambio de turno pendiente de revisión
const getCambioTurnoNotificarJefeTemplate = (jefe, empleado, solicitud, empleadoReemplazo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          ⏳ Solicitud de Cambio de Turno Pendiente de Revisión
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Nueva solicitud requiere tu aprobación
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${jefe.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        El empleado <strong>${empleado.nombres}</strong> ha solicitado un cambio de turno que ya cuenta con el visto bueno del reemplazo y ahora requiere tu <strong>aprobación</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Empleado Solicitante</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Turno Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.fecha_turno_reemplazo ? new Date(solicitud.fecha_turno_reemplazo).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No especificada'}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Empleado de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleadoReemplazo?.nombres || solicitud.nombre_reemplazo || 'No especificado'}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Visto Bueno</p>
          <p style="margin: 0; color: #28a745; font-size: 16px; font-weight: 600;">✅ Aprobado</p>
        </div>
      </div>
    </div>
    
    ${solicitud.motivo ? `
      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          📝 Motivo del Cambio
        </h4>
        <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
          ${solicitud.motivo}
        </p>
      </div>
    ` : ''}
    
    ${solicitud.afectacion_nomina ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          💰 Afectación a Nómina
        </h4>
        <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.6;">
          Esta solicitud tiene afectación a nómina: <strong>${solicitud.afectacion_nomina}</strong>
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        ⚡ Acción Requerida
      </h4>
      <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Por favor, ingresa al sistema Portal UCI para revisar y aprobar o rechazar esta solicitud de cambio de turno.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para notificación al reemplazo cuando se rechaza por jefe
const getReemplazoRechazadoTemplate = (empleadoReemplazo, solicitud, empleadoSolicitante, motivo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #721c24; margin: 0; font-size: 24px; font-weight: 600;">
          ❌ Cambio de Turno Cancelado
        </h2>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 16px;">
          El cambio de turno ha sido rechazado por el jefe
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleadoReemplazo.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        La solicitud de cambio de turno en la que eres el <strong>reemplazo</strong> ha sido <strong>RECHAZADA</strong> por el jefe de área.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #721c24; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Cambio de Turno
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha del Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario a Cambiar</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_cambiar}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Horario de Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.horario_reemplazo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Solicitante</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleadoSolicitante.nombres}</p>
        </div>
      </div>
    </div>
    
    ${motivo ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          📝 Motivo del Rechazo
        </h4>
        <p style="margin: 0; color: #856404; font-size: 16px; line-height: 1.6;">
          ${motivo}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        💡 Información Importante
      </h4>
      <p style="margin: 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
        El cambio de turno <strong>NO se realizará</strong>. Puedes continuar con tu horario normal.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para vacaciones aprobada
const getVacacionesAprobadaTemplate = (empleado, solicitud, reemplazo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
        <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
        <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
          ✅ Vacaciones Aprobadas
        </h2>
        <p style="color: #e8f5e8; margin: 10px 0 0 0; font-size: 16px;">
          ¡Tu solicitud de vacaciones ha sido aprobada exitosamente!
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>, 🎊
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        ¡Excelentes noticias! Tu solicitud de vacaciones ha sido <strong>APROBADA</strong> por el reemplazo asignado.
      </p>
    </div>
    
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #4caf50;">
      <h3 style="color: #2e7d32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de las Vacaciones
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">📅 Período de Disfrute</p>
          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: 600;">
            ${new Date(solicitud.periodo_disfrute_desde).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">🆔 Número de Solicitud</p>
          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">👥 Reemplazo Asignado</p>
          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: 600;">
            ${solicitud.reemplazo_nombre || 'No asignado'}
          </p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">✅ Estado</p>
          <p style="margin: 0; color: #4caf50; font-size: 16px; font-weight: 600;">
            ✅ APROBADO
          </p>
        </div>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #4caf50;">
      <h4 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🎯 Próximos Pasos
      </h4>
      <p style="color: #2e7d32; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
        Tu solicitud continuará su proceso de aprobación con el Administrador y Recursos Humanos.
      </p>
      <div style="background: #ffffff; padding: 15px; border-radius: 8px; margin-top: 15px;">
        <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.5;">
          <strong>Observaciones:</strong> ${solicitud.observaciones || 'Sin observaciones adicionales'}
        </p>
        ${solicitud.actividades_pendientes ? `
          <p style="margin: 10px 0 0 0; color: #2e7d32; font-size: 14px; line-height: 1.5;">
            <strong>Actividades Pendientes:</strong> ${solicitud.actividades_pendientes}
          </p>
        ` : ''}
      </div>
    </div>
    
    <div style="background: #e3f2fd; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #2196f3;">
      <h4 style="color: #1565c0; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        💡 Información Importante
      </h4>
      <p style="color: #1565c0; font-size: 14px; line-height: 1.5; margin: 0;">
        Te notificaremos por correo electrónico cuando tu solicitud sea aprobada completamente por todas las instancias.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        ¡Disfruta de tus vacaciones! 🏖️<br>
        <strong>Portal UCI - Sistema de Gestión de RRHH</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para vacaciones rechazada
const getVacacionesRechazadaTemplate = (empleado, solicitud, reemplazo) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #721c24; margin: 0; font-size: 24px; font-weight: 600;">
          ❌ Vacaciones Rechazadas
        </h2>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud de vacaciones ha sido rechazada
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Lamentamos informarte que tu solicitud de vacaciones ha sido <strong>RECHAZADA</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #dc3545; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de las Vacaciones
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Período de Disfrute</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - ${new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Días Solicitados</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.dias_disfrute} días
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado</p>
          <p style="margin: 0; color: #dc3545; font-size: 16px; font-weight: 600;">
            ❌ RECHAZADO
          </p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        📝 Motivo del Rechazo
      </h4>
      <p style="color: #333333; font-size: 14px; line-height: 1.5; margin: 0;">
        <strong>Motivo:</strong> ${solicitud.motivo_rechazo || 'No especificado'}
      </p>
      ${solicitud.observaciones ? `
        <p style="color: #333333; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
          <strong>Observaciones:</strong> ${solicitud.observaciones}
        </p>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Si tienes alguna pregunta sobre esta decisión, contacta a tu jefe inmediato o al departamento de RRHH.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para vacaciones en revisión
const getVacacionesEnRevisionTemplate = (empleado, solicitud, jefe) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          ⏳ Vacaciones en Revisión
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud de vacaciones ha sido aprobada por tu jefe y está pendiente del visto bueno del reemplazo
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Tu solicitud de vacaciones ha sido <strong>APROBADA</strong> por tu jefe inmediato y ahora está pendiente del visto bueno del reemplazo asignado.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #856404; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de las Vacaciones
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Período de Disfrute</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - ${new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Días Solicitados</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.dias_disfrute} días
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Reemplazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.reemplazo_nombre || 'No asignado'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado</p>
          <p style="margin: 0; color: #856404; font-size: 16px; font-weight: 600;">
            ⏳ EN REVISIÓN
          </p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e7f3ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #0056b3; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        📝 Próximos Pasos
      </h4>
      <p style="color: #333333; font-size: 14px; line-height: 1.5; margin: 0;">
        Tu solicitud está siendo revisada por el reemplazo asignado. Te notificaremos cuando se complete la revisión.
      </p>
      ${solicitud.observaciones ? `
        <p style="color: #333333; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
          <strong>Observaciones del Jefe:</strong> ${solicitud.observaciones}
        </p>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Te mantendremos informado sobre el estado de tu solicitud.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para vacaciones aprobadas por administrador
const getVacacionesAprobadaPorAdminTemplate = (empleado, vacacion) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h2>✅ Solicitud de Vacaciones Aprobada por Administrador</h2>
      </div>
      <div style="background-color: white; padding: 20px; border-radius: 0 0 5px 5px;">
        <p>Hola <strong>${empleado.nombres}</strong>,</p>
        <p>Tu solicitud de vacaciones ha sido <strong>aprobada por el administrador</strong> y está pendiente de la aprobación final de Recursos Humanos.</p>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2E7D32;">📋 Detalles de la Solicitud</h3>
          <p><strong>Número de Solicitud:</strong> ${vacacion.id}</p>
          <p><strong>Período de Disfrute:</strong> ${new Date(vacacion.periodo_disfrute_desde).toLocaleDateString()} - ${new Date(vacacion.periodo_disfrute_hasta).toLocaleDateString()}</p>
          <p><strong>Días Solicitados:</strong> ${vacacion.dias_disfrute}</p>
          <p><strong>Estado Actual:</strong> Aprobado por Administrador</p>
        </div>
        
        <p>Tu solicitud continuará su proceso de aprobación con Recursos Humanos. Te notificaremos cuando sea aprobada completamente.</p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
          <p style="margin: 0; color: #856404;"><strong>⏳ Próximo paso:</strong> Aprobación final por Recursos Humanos</p>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Si tienes alguna pregunta, no dudes en contactar a Recursos Humanos.
        </p>
      </div>
    </div>
  `;
};

// Plantilla para vacaciones aprobadas por RRHH
const getVacacionesAprobadaPorRRHHTemplate = (empleado, vacacion) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h2>🎉 Solicitud de Vacaciones Aprobada Completamente</h2>
      </div>
      <div style="background-color: white; padding: 20px; border-radius: 0 0 5px 5px;">
        <p>Hola <strong>${empleado.nombres}</strong>,</p>
        <p>¡Excelentes noticias! Tu solicitud de vacaciones ha sido <strong>aprobada completamente</strong> por Recursos Humanos.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2E7D32;">✅ Solicitud Aprobada</h3>
          <p><strong>Número de Solicitud:</strong> ${vacacion.id}</p>
          <p><strong>Período de Disfrute:</strong> ${new Date(vacacion.periodo_disfrute_desde).toLocaleDateString()} - ${new Date(vacacion.periodo_disfrute_hasta).toLocaleDateString()}</p>
          <p><strong>Días Aprobados:</strong> ${vacacion.dias_disfrute}</p>
          <p><strong>Estado Final:</strong> Aprobado</p>
          <p><strong>Fecha de Aprobación:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;">
          <p style="margin: 0; color: #155724;"><strong>🎯 Proceso Completado:</strong> Tu solicitud ha pasado por todas las etapas de aprobación</p>
        </div>
        
        <p style="margin-top: 20px;">
          <strong>Próximos pasos:</strong>
        </p>
        <ul style="color: #666;">
          <li>Coordina con tu jefe inmediato la cobertura durante tu ausencia</li>
          <li>Actualiza tu calendario de trabajo</li>
          <li>Prepara la documentación necesaria para el departamento de nómina</li>
        </ul>
        
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          ¡Disfruta de tus vacaciones! Si necesitas alguna aclaración, contacta a Recursos Humanos.
        </p>
      </div>
    </div>
  `;
};

// Plantilla para nueva solicitud de vacaciones creada
const getVacacionesCreadaTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
        <div style="font-size: 48px; margin-bottom: 15px;">🏖️</div>
        <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
          ✨ Solicitud de Vacaciones Creada
        </h2>
        <p style="color: #e8eaf6; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud ha sido registrada exitosamente en el sistema
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>, 👋
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Tu solicitud de vacaciones ha sido <strong>creada exitosamente</strong> y está siendo procesada por el sistema.
      </p>
    </div>
    
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #667eea;">
      <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de tu Solicitud
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">🔢 Número de Solicitud</p>
          <p style="margin: 0; color: #495057; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">📅 Fecha de Solicitud</p>
          <p style="margin: 0; color: #495057; font-size: 16px; font-weight: 600;">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">⏰ Estado Actual</p>
          <p style="margin: 0; color: #ffc107; font-size: 16px; font-weight: 600;">⏳ PENDIENTE DE REVISIÓN</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">👤 Solicitante</p>
          <p style="margin: 0; color: #495057; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #2196f3;">
      <h4 style="color: #1565c0; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🚀 Próximos Pasos del Proceso
      </h4>
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <div style="background: #2196f3; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">1</div>
        <p style="margin: 0; color: #1565c0; font-size: 14px;">Revisión por tu Jefe Inmediato</p>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <div style="background: #ff9800; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">2</div>
        <p style="margin: 0; color: #1565c0; font-size: 14px;">Aprobación por Administrador</p>
      </div>
      <div style="display: flex; align-items: center;">
        <div style="background: #4caf50; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">3</div>
        <p style="margin: 0; color: #1565c0; font-size: 14px;">Aprobación Final por RRHH</p>
      </div>
    </div>
    
    <div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
      <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
        💡 Información Importante
      </h4>
      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
        Te notificaremos por correo electrónico en cada etapa del proceso. Puedes consultar el estado de tu solicitud en cualquier momento desde el Portal UCI.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        ¡Gracias por usar Portal UCI! 🎉<br>
        <strong>Sistema de Gestión de Recursos Humanos</strong>
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Plantilla para nueva solicitud de vacaciones (notificación al jefe)
const getVacacionesNuevaSolicitudTemplate = (empleado, jefe, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
        <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
        <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
          🆕 Nueva Solicitud de Vacaciones
        </h2>
        <p style="color: #ffeaa7; margin: 10px 0 0 0; font-size: 16px;">
          Requiere tu revisión y aprobación inmediata
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${jefe.nombres}</strong>, 👋
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        El empleado <strong>${empleado.nombres}</strong> ha creado una nueva solicitud de vacaciones que requiere tu revisión y aprobación.
      </p>
    </div>
    
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #ff6b6b;">
      <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        👤 Información del Solicitante
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">👨‍💼 Nombre Completo</p>
          <p style="margin: 0; color: #495057; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">🆔 Número de Solicitud</p>
          <p style="margin: 0; color: #495057; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">📅 Fecha de Solicitud</p>
          <p style="margin: 0; color: #495057; font-size: 16px; font-weight: 600;">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 500;">⏰ Estado</p>
          <p style="margin: 0; color: #ffc107; font-size: 16px; font-weight: 600;">⏳ PENDIENTE</p>
        </div>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #4caf50;">
      <h4 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        ⚡ Acción Requerida
      </h4>
      <p style="margin: 0; color: #2e7d32; font-size: 16px; line-height: 1.6;">
        Por favor, ingresa al <strong>Portal UCI</strong> para revisar y procesar esta solicitud de vacaciones lo antes posible. Tu aprobación es necesaria para continuar con el proceso.
      </p>
    </div>
    
    <div style="background: #e3f2fd; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #2196f3;">
      <h4 style="color: #1565c0; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🔗 Acceso al Sistema
      </h4>
      <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.5;">
        Accede a tu panel de gestión en Portal UCI para revisar todos los detalles de la solicitud y tomar la decisión correspondiente.
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
      <p style="color: #6c757d; font-size: 14px; margin: 0;">
        Saludos,<br>
        <strong>Portal UCI - Sistema de Gestión de RRHH</strong> 🏢
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar a administración cuando el jefe aprueba
const getVacacionesNotificarAdministracionTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          ⏳ Solicitud Pendiente de Administración
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Nueva solicitud de vacaciones requiere tu aprobación
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>Administración</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Se ha recibido una nueva solicitud de vacaciones que requiere tu <strong>aprobación</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Empleado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Días Solicitados</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.dias_disfrute} días</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado Actual</p>
          <p style="margin: 0; color: #007bff; font-size: 16px; font-weight: 600;">✅ Aprobada por Jefe</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e3f2fd; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
        📅 Período de Vacaciones
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Desde</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.periodo_disfrute_desde).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Hasta</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 15px 0;">
        Por favor, accede al sistema para revisar y aprobar esta solicitud.
      </p>
      <div style="background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 6px; display: inline-block; text-decoration: none; font-weight: 600;">
        🔗 Acceder al Sistema
      </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar a RRHH cuando administración aprueba
const getVacacionesNotificarRRHHTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          ⏳ Solicitud Pendiente de RRHH
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Solicitud de vacaciones requiere aprobación final
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>Recursos Humanos</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Se ha recibido una solicitud de vacaciones que requiere tu <strong>aprobación final</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Empleado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Días Solicitados</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${solicitud.dias_disfrute} días</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado Actual</p>
          <p style="margin: 0; color: #007bff; font-size: 16px; font-weight: 600;">✅ Aprobada por Administración</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e3f2fd; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
        📅 Período de Vacaciones
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Desde</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.periodo_disfrute_desde).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Hasta</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 15px 0;">
        Por favor, accede al sistema para revisar y dar la aprobación final.
      </p>
      <div style="background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 6px; display: inline-block; text-decoration: none; font-weight: 600;">
        🔗 Acceder al Sistema
      </div>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar a nuevos usuarios con sus credenciales
const getNuevoUsuarioTemplate = (empleado, documento) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido al Portal UCI</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #2E7D32;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2E7D32;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #666;
                font-size: 16px;
            }
            .welcome-section {
                background: linear-gradient(135deg, #2E7D32, #4CAF50);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
                text-align: center;
            }
            .welcome-title {
                font-size: 24px;
                margin-bottom: 10px;
                font-weight: bold;
            }
            .welcome-text {
                font-size: 16px;
                opacity: 0.9;
            }
            .credentials-section {
                background-color: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 25px;
            }
            .credentials-title {
                font-size: 18px;
                font-weight: bold;
                color: #2E7D32;
                margin-bottom: 15px;
                text-align: center;
            }
            .credential-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #dee2e6;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .credential-label {
                font-weight: bold;
                color: #495057;
            }
            .credential-value {
                background-color: #e9ecef;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                color: #2E7D32;
            }
            .login-section {
                background-color: #e8f5e8;
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 25px;
                text-align: center;
            }
            .login-title {
                font-size: 18px;
                font-weight: bold;
                color: #2E7D32;
                margin-bottom: 15px;
            }
            .login-button {
                display: inline-block;
                background: linear-gradient(135deg, #2E7D32, #4CAF50);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .login-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }
            .security-section {
                background-color: #fff3cd;
                border: 2px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 25px;
            }
            .security-title {
                font-size: 16px;
                font-weight: bold;
                color: #856404;
                margin-bottom: 10px;
            }
            .security-text {
                color: #856404;
                font-size: 14px;
                line-height: 1.5;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                color: #6c757d;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 15px;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Portal UCI</div>
                <div class="subtitle">Sistema de Gestión de Recursos Humanos</div>
            </div>

            <div class="welcome-section">
                <div class="welcome-title">¡Bienvenido/a, ${empleado.nombres}!</div>
                <div class="welcome-text">
                    Tu cuenta ha sido creada exitosamente en nuestro sistema de gestión.
                </div>
            </div>

            <div class="credentials-section">
                <div class="credentials-title">Tus Credenciales de Acceso</div>
                <div class="credential-item">
                    <span class="credential-label">Usuario:</span>
                    <span class="credential-value">${empleado.email}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Contraseña:</span>
                    <span class="credential-value">${documento}</span>
                </div>
            </div>

            <div class="login-section">
                <div class="login-title">🚀 Accede a tu cuenta</div>
                <p style="margin-bottom: 20px; color: #2E7D32;">
                    Haz clic en el botón de abajo para acceder al portal:
                </p>
                <a href="https://google.com" class="login-button">
                    🔗 Acceder al Portal
                </a>
            </div>

            <div class="security-section">
                <div class="security-title">🔒 Recomendaciones de Seguridad</div>
                <div class="security-text">
                    • Cambia tu contraseña después del primer inicio de sesión<br>
                    • No compartas tus credenciales con nadie<br>
                    • Cierra sesión cuando termines de usar el sistema<br>
                    • Mantén tu información personal actualizada
                </div>
            </div>

            <div class="footer">
                <p>Este es un mensaje automático del sistema Portal UCI</p>
                <div class="contact-info">
                    Si tienes problemas para acceder, contacta al departamento de RRHH<br>
                    📧 rrhh@empresa.com | 📞 (1) 123-4567
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// ========================================
// PLANTILLAS PARA CESANTÍAS
// ========================================

// Template para notificar que se creó una solicitud de cesantías
const getCesantiasCreadaTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #1976d2; margin: 0; font-size: 24px; font-weight: 600;">
          ✨ Solicitud de Cesantías Creada
        </h2>
        <p style="color: #1976d2; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud ha sido registrada exitosamente
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Se ha creado exitosamente tu solicitud de cesantías en el sistema. Tu solicitud está siendo procesada y recibirás notificación por correo electrónico una vez sea revisada.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado</p>
          <p style="margin: 0; color: #28a745; font-size: 16px; font-weight: 600;">🔄 Pendiente de Revisión</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Tipo de Retiro</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.tipo_retiro === 'carta_banco' ? '📄 Carta Banco' : '🏦 Consignación en Cuenta'}
          </p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        ℹ️ Información Importante
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #2E7D32; font-size: 14px; line-height: 1.6;">
        <li>Tu solicitud será revisada por el departamento de Recursos Humanos</li>
        <li>Recibirás notificación por correo electrónico del estado de tu solicitud</li>
        <li>El proceso puede tomar entre 3-5 días hábiles</li>
        <li>Si tienes alguna pregunta, contacta al departamento de RRHH</li>
      </ul>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar que una solicitud de cesantías fue aprobada
const getCesantiasAprobadaTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #155724; margin: 0; font-size: 24px; font-weight: 600;">
          ✅ Solicitud de Cesantías Aprobada
        </h2>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 16px;">
          ¡Tu solicitud ha sido aprobada exitosamente!
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        ¡Excelentes noticias! Tu solicitud de cesantías ha sido <strong>APROBADA</strong> por el jefe de área de Recursos Humanos.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Aprobación
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado</p>
          <p style="margin: 0; color: #28a745; font-size: 16px; font-weight: 600;">✅ Aprobada</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Monto Aprobado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            $${solicitud.monto_aprobado?.toLocaleString() || 'No especificado'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Aprobación</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
    
    ${solicitud.observaciones ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
          📝 Observaciones
        </h4>
        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
          ${solicitud.observaciones}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🎯 Próximos Pasos
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #2E7D32; font-size: 14px; line-height: 1.6;">
        <li>Recibirás más información sobre el proceso de pago en los próximos días</li>
        <li>El departamento de RRHH se pondrá en contacto contigo para coordinar la entrega</li>
        <li>Mantén tu información de contacto actualizada</li>
        <li>Si tienes alguna pregunta, contacta al departamento de RRHH</li>
      </ul>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar que una solicitud de cesantías fue rechazada
const getCesantiasRechazadaTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #721c24; margin: 0; font-size: 24px; font-weight: 600;">
          ❌ Solicitud de Cesantías Rechazada
        </h2>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 16px;">
          Tu solicitud no pudo ser aprobada
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Lamentamos informarte que tu solicitud de cesantías ha sido <strong>RECHAZADA</strong> por el jefe de área de Recursos Humanos.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #dc3545; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles del Rechazo
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado</p>
          <p style="margin: 0; color: #dc3545; font-size: 16px; font-weight: 600;">❌ Rechazada</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Motivo del Rechazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.motivo_rechazo || 'No especificado'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Rechazo</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
    
    ${solicitud.observaciones ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
          📝 Observaciones
        </h4>
        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
          ${solicitud.observaciones}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #721c24; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🔍 ¿Qué puedes hacer?
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #721c24; font-size: 14px; line-height: 1.6;">
        <li>Revisa la documentación enviada y asegúrate de que esté completa</li>
        <li>Si tienes dudas sobre el motivo del rechazo, contacta al departamento de RRHH</li>
        <li>Puedes presentar una nueva solicitud con la información corregida</li>
        <li>El departamento de RRHH está disponible para ayudarte</li>
      </ul>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar cambio de estado de cesantías
const getCesantiasCambioEstadoTemplate = (empleado, solicitud, estadoAnterior, estadoNuevo) => {
  const estadoText = {
    'en_revision': 'en revisión',
    'aprobado': 'aprobada',
    'rechazado': 'rechazada'
  };
  
  const estadoColor = {
    'en_revision': '#ffc107',
    'aprobado': '#28a745',
    'rechazado': '#dc3545'
  };
  
  const estadoIcon = {
    'en_revision': '⏳',
    'aprobado': '✅',
    'rechazado': '❌'
  };
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: ${estadoColor[estadoNuevo]}20; border: 1px solid ${estadoColor[estadoNuevo]}; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: ${estadoColor[estadoNuevo]}; margin: 0; font-size: 24px; font-weight: 600;">
          ${estadoIcon[estadoNuevo]} Solicitud de Cesantías ${estadoText[estadoNuevo]}
        </h2>
        <p style="color: ${estadoColor[estadoNuevo]}; margin: 10px 0 0 0; font-size: 16px;">
          El estado de tu solicitud ha cambiado
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>${empleado.nombres}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        El estado de tu solicitud de cesantías ha cambiado de <strong>${estadoText[estadoAnterior] || estadoAnterior}</strong> a <strong>${estadoText[estadoNuevo] || estadoNuevo}</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado Anterior</p>
          <p style="margin: 0; color: #6c757d; font-size: 16px; font-weight: 600;">${estadoText[estadoAnterior] || estadoAnterior}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado Actual</p>
          <p style="margin: 0; color: ${estadoColor[estadoNuevo]}; font-size: 16px; font-weight: 600;">${estadoText[estadoNuevo] || estadoNuevo}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Cambio</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
    
    ${solicitud.observaciones ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
          📝 Observaciones
        </h4>
        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
          ${solicitud.observaciones}
        </p>
      </div>
    ` : ''}
    
    ${solicitud.motivo_rechazo ? `
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h4 style="color: #721c24; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
          ❌ Motivo del Rechazo
        </h4>
        <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.6;">
          ${solicitud.motivo_rechazo}
        </p>
      </div>
    ` : ''}
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar a administración sobre nueva solicitud de cesantías
const getCesantiasNotificarAdministracionTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          ⏳ Solicitud de Cesantías Pendiente de Administración
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Nueva solicitud de cesantías requiere tu revisión y aprobación
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>Administración</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Se ha recibido una nueva solicitud de <strong>cesantías</strong> que requiere tu revisión y aprobación antes de ser enviada a RRHH.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud de Cesantías
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Empleado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Tipo de Retiro</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.tipo_retiro === 'carta_banco' ? '📄 Carta Banco' : '🏦 Consignación en Cuenta'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Monto Solicitado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            $${solicitud.monto_solicitado?.toLocaleString() || 'No especificado'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado Actual</p>
          <p style="margin: 0; color: #ffc107; font-size: 16px; font-weight: 600;">⏳ En Revisión</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🎯 Acción Requerida
      </h4>
      <p style="color: #2E7D32; margin: 0; font-size: 14px; line-height: 1.6;">
        Por favor, revisa la solicitud de cesantías y aprueba o rechaza según corresponda. Una vez que tomes una decisión, la solicitud será enviada a RRHH para la aprobación final y el procesamiento del pago.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// Template para notificar a RRHH sobre solicitud aprobada por administración
const getCesantiasNotificarRRHHTemplate = (empleado, solicitud) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #856404; margin: 0; font-size: 24px; font-weight: 600;">
          ⏳ Solicitud de Cesantías Pendiente de RRHH
        </h2>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 16px;">
          Solicitud de cesantías requiere aprobación final y procesamiento
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hola <strong>Recursos Humanos</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Se ha recibido una solicitud de <strong>cesantías</strong> que requiere tu aprobación final y procesamiento del pago.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
        📋 Detalles de la Solicitud de Cesantías
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Empleado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${empleado.nombres}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Número de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">#${solicitud.id}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Fecha de Solicitud</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Tipo de Retiro</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            ${solicitud.tipo_retiro === 'carta_banco' ? '📄 Carta Banco' : '🏦 Consignación en Cuenta'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Monto Solicitado</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">
            $${solicitud.monto_solicitado?.toLocaleString() || 'No especificado'}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px; font-weight: 500;">Estado Actual</p>
          <p style="margin: 0; color: #28a745; font-size: 16px; font-weight: 600;">✅ Aprobada por Administración</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        🎯 Acción Requerida
      </h4>
      <p style="color: #2E7D32; margin: 0; font-size: 14px; line-height: 1.6;">
        Esta solicitud de cesantías ya fue aprobada por administración. Ahora requiere tu aprobación final como departamento de RRHH para completar el proceso y proceder con el pago de las cesantías al empleado.
      </p>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
        💰 Información Importante sobre Cesantías
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.6;">
        <li>Las cesantías son un beneficio social obligatorio por ley</li>
        <li>Se calculan sobre el salario base del empleado</li>
        <li>Se pagan al finalizar la relación laboral o en casos especiales</li>
        <li>Requiere verificación de documentación y cálculos precisos</li>
      </ul>
    </div>
  `;
  
  return getBaseTemplate(content);
};

module.exports = {
  getPermisoAprobadoTemplate,
  getPermisoRechazadoTemplate,
  getNuevaSolicitudTemplate,
  getCambioTurnoVistoBuenoTemplate,
  getCambioTurnoAprobadoTemplate,
  getCambioTurnoRechazadoTemplate,
  getCambioTurnoNotificarJefeTemplate,
  getVistoBuenoAprobadoTemplate,
  getVistoBuenoRechazadoTemplate,
  getReemplazoAprobadoTemplate,
  getReemplazoRechazadoTemplate,
  getVacacionesAprobadaTemplate,
  getVacacionesRechazadaTemplate,
  getVacacionesEnRevisionTemplate,
  getVacacionesAprobadaPorAdminTemplate,
  getVacacionesAprobadaPorRRHHTemplate,
  getVacacionesCreadaTemplate,
  getVacacionesNuevaSolicitudTemplate,
  getVacacionesNotificarAdministracionTemplate,
  getVacacionesNotificarRRHHTemplate,
  getNuevoUsuarioTemplate,
  getCesantiasCreadaTemplate,
  getCesantiasAprobadaTemplate,
  getCesantiasRechazadaTemplate,
  getCesantiasCambioEstadoTemplate,
  getCesantiasNotificarAdministracionTemplate,
  getCesantiasNotificarRRHHTemplate
}; 
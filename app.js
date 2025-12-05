// ============================================
// CONFIGURACIÓN - REEMPLAZA ESTA URL MÁS ADELANTE
// ============================================
let SCRIPT_URL = ''; // Se configurará después

// Datos para autocompletado (en MAYÚSCULAS)
const sugerencias = {
    torre: ["ADMINISTRATIVA", "MÉDICA", "QUIRÚRGICA", "PEDIATRÍA", "MATERNIDAD", "EMERGENCIAS"],
    area: ["ADMINISTRACIÓN", "CONTABILIDAD", "ENFERMERÍA", "LABORATORIO", "RAYOS X", "FARMACIA", "CIRUGÍA", "UCI", "CONSULTA EXTERNA"],
    piso: ["PISO 1", "PISO 2", "PISO 3", "PISO 4", "PISO 5", "PISO 6", "PISO 7", "PISO 8"],
    software: ["WINDOWS", "OFFICE", "CORREO", "SISTEMA HIS", "PACS", "IMPRESORA", "SCANNER", "RED WIFI", "INTERNET"]
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// 1. INICIALIZAR CUANDO CARGUE LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Formulario de incidencias cargado');
    
    // Mostrar instrucciones iniciales si no hay URL configurada
    if (!SCRIPT_URL) {
        mostrarInstruccionesIniciales();
    }
    
    // Configurar autocompletado
    configurarAutocompletado();
    
    // Configurar eventos
    configurarEventos();
    
    // Convertir automáticamente a mayúsculas
    convertirAMayusculasAutomatico();
});

// 2. MOSTRAR INSTRUCCIONES INICIALES
function mostrarInstruccionesIniciales() {
    // Crear mensaje informativo
    const cardBody = document.querySelector('.card-body');
    if (cardBody) {
        const alertHTML = `
            <div class="alert alert-info" id="alertConfiguracion">
                <h5 class="alert-heading">
                    <i class="fas fa-cogs me-2"></i>Configuración Requerida
                </h5>
                <p class="mb-2">Para que el formulario funcione, necesitas:</p>
                <ol class="mb-0 ps-3">
                    <li>Crear un Google Apps Script</li>
                    <li>Configurar la URL en app.js</li>
                    <li>Publicar como aplicación web</li>
                </ol>
                <hr>
                <p class="mb-0">
                    <small>Mientras tanto, los datos se guardarán localmente.</small>
                </p>
            </div>
        `;
        cardBody.insertAdjacentHTML('afterbegin', alertHTML);
    }
}

// 3. CONFIGURAR AUTOCOMPLETADO
function configurarAutocompletado() {
    const campos = ['torre', 'area', 'piso', 'software'];
    
    campos.forEach(campo => {
        const input = document.getElementById(campo);
        const lista = document.getElementById(`lista${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
        
        if (input && lista) {
            input.addEventListener('input', function() {
                const valor = this.value.toUpperCase();
                lista.innerHTML = '';
                
                if (valor.length > 0) {
                    const filtradas = sugerencias[campo].filter(item => 
                        item.includes(valor)
                    );
                    
                    filtradas.forEach(item => {
                        const div = document.createElement('div');
                        div.textContent = item;
                        div.addEventListener('click', function() {
                            input.value = item;
                            lista.innerHTML = '';
                            lista.style.display = 'none';
                        });
                        lista.appendChild(div);
                    });
                    
                    lista.style.display = filtradas.length > 0 ? 'block' : 'none';
                } else {
                    lista.style.display = 'none';
                }
            });
            
            // Ocultar lista al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!input.contains(e.target) && !lista.contains(e.target)) {
                    lista.style.display = 'none';
                }
            });
        }
    });
}

// 4. CONFIGURAR EVENTOS
function configurarEventos() {
    const formulario = document.getElementById('formRegistro');
    const btnLimpiar = document.getElementById('btnLimpiar');
    
    // Envío del formulario
    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();
        await enviarFormulario();
    });
    
    // Botón limpiar
    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        limpiarValidaciones();
        mostrarMensaje('Formulario limpiado', 'info');
    });
}

// 5. CONVERTIR A MAYÚSCULAS AUTOMÁTICAMENTE
function convertirAMayusculasAutomatico() {
    const campos = document.querySelectorAll('input[type="text"], textarea');
    
    campos.forEach(campo => {
        campo.addEventListener('input', function() {
            const inicio = this.selectionStart;
            const fin = this.selectionEnd;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(inicio, fin);
        });
    });
}

// 6. ENVIAR FORMULARIO
async function enviarFormulario() {
    // Validar formulario
    if (!validarFormulario()) {
        mostrarMensaje('Complete todos los campos requeridos correctamente', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const datos = obtenerDatosFormulario();
    
    console.log('📤 Datos a enviar:', datos);
    
    // Mostrar carga
    const btnSubmit = document.getElementById('btnRegistrar');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>ENVIANDO...';
    btnSubmit.disabled = true;
    
    try {
        // Si hay URL configurada, enviar a Google Sheets
        if (SCRIPT_URL) {
            const respuesta = await enviarAGoogleSheets(datos);
            
            if (respuesta.success) {
                mostrarMensaje(`✅ Registrado exitosamente`, 'success');
                formulario.reset();
                limpiarValidaciones();
                
                // Opcional: Redirigir a Google Sheets después de 2 segundos
                setTimeout(() => {
                    window.open('https://docs.google.com/spreadsheets/d/1coI01R8BGI46h6nGHxDkCI-AQn3QNWYNyHnvbmhky3A', '_blank');
                }, 2000);
            } else {
                throw new Error(respuesta.error || 'Error del servidor');
            }
        } else {
            // Guardar localmente si no hay URL configurada
            guardarLocalmente(datos);
            mostrarMensaje('📱 Datos guardados localmente (configura la URL para Google Sheets)', 'warning');
            formulario.reset();
            limpiarValidaciones();
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarMensaje(`Error: ${error.message}`, 'error');
        
        // Intentar guardar localmente como respaldo
        guardarLocalmente(datos);
        mostrarMensaje('Los datos se guardaron localmente como respaldo', 'info');
        
    } finally {
        // Restaurar botón
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.disabled = false;
    }
}

// 7. OBTENER DATOS DEL FORMULARIO
function obtenerDatosFormulario() {
    return {
        fecha: new Date().toLocaleString('es-ES'),
        nombre: document.getElementById('nombre').value.trim(),
        torre: document.getElementById('torre').value.trim(),
        area: document.getElementById('area').value.trim(),
        piso: formatearPiso(document.getElementById('piso').value.trim()),
        software: document.getElementById('software').value.trim(),
        otroDispositivo: document.getElementById('otroDispositivo').value.trim(),
        detalle: document.getElementById('detalle').value.trim(),
        observacion: document.getElementById('observacion').value.trim()
    };
}

// 8. FORMATEAR PISO
function formatearPiso(piso) {
    if (!piso) return '';
    if (piso.toUpperCase().startsWith('PISO ')) return piso.toUpperCase();
    const numero = piso.replace(/[^0-9]/g, '');
    return numero ? `PISO ${numero}` : piso.toUpperCase();
}

// 9. VALIDAR FORMULARIO
function validarFormulario() {
    let valido = true;
    
    // Limpiar validaciones previas
    limpiarValidaciones();
    
    // Campos requeridos
    const camposRequeridos = ['nombre', 'torre', 'area', 'piso', 'detalle'];
    
    camposRequeridos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !campo.value.trim()) {
            campo.classList.add('is-invalid');
            valido = false;
        }
    });
    
    // Validar longitud mínima del detalle
    const detalle = document.getElementById('detalle');
    if (detalle && detalle.value.trim().length < 10) {
        detalle.classList.add('is-invalid');
        valido = false;
    }
    
    return valido;
}

// 10. LIMPIAR VALIDACIONES
function limpiarValidaciones() {
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

// 11. ENVIAR A GOOGLE SHEETS
async function enviarAGoogleSheets(datos) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        // Intentar parsear la respuesta
        try {
            const texto = await response.text();
            return JSON.parse(texto);
        } catch {
            // Si no es JSON válido, asumir éxito
            return { success: true, message: 'Enviado' };
        }
        
    } catch (error) {
        throw new Error('No se pudo conectar con el servidor');
    }
}

// 12. GUARDAR LOCALMENTE
function guardarLocalmente(datos) {
    try {
        const registros = JSON.parse(localStorage.getItem('incidencias_pendientes') || '[]');
        registros.push({
            ...datos,
            timestamp: new Date().toISOString(),
            sincronizado: false
        });
        localStorage.setItem('incidencias_pendientes', JSON.stringify(registros));
        console.log('💾 Guardado localmente:', datos);
        return true;
    } catch (error) {
        console.error('Error guardando localmente:', error);
        return false;
    }
}

// 13. MOSTRAR MENSAJE
function mostrarMensaje(texto, tipo = 'info') {
    Swal.fire({
        icon: tipo,
        title: tipo === 'success' ? '¡ÉXITO!' : 
               tipo === 'error' ? 'ERROR' : 
               tipo === 'warning' ? 'ADVERTENCIA' : 'INFORMACIÓN',
        text: texto,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

// ============================================
// FUNCIONES ADICIONALES ÚTILES
// ============================================

// Mostrar registros guardados localmente
function mostrarRegistrosLocales() {
    const registros = JSON.parse(localStorage.getItem('incidencias_pendientes') || '[]');
    console.log('Registros locales:', registros);
    
    if (registros.length > 0) {
        Swal.fire({
            title: 'Registros pendientes',
            html: `<p>Tienes <strong>${registros.length}</strong> registro(s) guardados localmente.</p>`,
            icon: 'info'
        });
    }
}

// Sincronizar registros pendientes cuando haya conexión
async function sincronizarPendientes() {
    if (!SCRIPT_URL || !navigator.onLine) return;
    
    const registros = JSON.parse(localStorage.getItem('incidencias_pendientes') || '[]');
    const pendientes = registros.filter(r => !r.sincronizado);
    
    if (pendientes.length === 0) return;
    
    console.log(`🔄 Sincronizando ${pendientes.length} registros pendientes...`);
    
    for (const registro of pendientes) {
        try {
            await enviarAGoogleSheets(registro);
            registro.sincronizado = true;
        } catch (error) {
            console.error('Error sincronizando registro:', error);
        }
    }
    
    // Actualizar localStorage
    const actualizados = registros.filter(r => !r.sincronizado);
    localStorage.setItem('incidencias_pendientes', JSON.stringify(actualizados));
    
    if (actualizados.length < registros.length) {
        mostrarMensaje(`${registros.length - actualizados.length} registros sincronizados`, 'success');
    }
}

// ============================================
// EVENTOS GLOBALES
// ============================================

// Sincronizar cuando se recupere la conexión
window.addEventListener('online', sincronizarPendientes);

// Mostrar registros locales al cargar (solo para debug)
// document.addEventListener('DOMContentLoaded', mostrarRegistrosLocales);
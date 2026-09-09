pipeline {
    agent any

    tools {
        // Herramienta Node.js configurada en Jenkins (Global Tool Configuration)
        nodejs 'node-22'
    }

    environment {
        // ============================================
        // PATH - Agregar rutas necesarias
        // ============================================
        // Agregamos Git al PATH para poder usar comandos git
        // Si Git está instalado en otra ruta, modificar aquí
        PATH = "C:\\Program Files\\Git\\bin;C:\\Program Files\\Git\\cmd;${env.PATH}"
        
        // ============================================
        // VARIABLES DEL PROYECTO
        // ============================================
        // Nombre del proyecto para identificación
        PROJECT_NAME = 'polleria-yacky-backend'
        
        // URL del repositorio Git
        REPO_URL = 'https://github.com/POLLERIA-YACKI-PROYECTO/POLLERIA-YACKI-BACKEND.git'
        
        // Rama a construir
        BRANCH = 'main'
        
        // Puerto donde corre el servidor
        PORT = '3000'
        
        // Entorno de ejecución (production, development, test)
        NODE_ENV = 'production'
        
        // ============================================
        // CREDENCIALES - Configurar en Jenkins
        // ============================================
        // Estas credenciales deben existir en Jenkins:
        // - JWT_SECRET: Secret text
        // - DB_HOST: Secret text
        // - DB_USER: Secret text  
        // - DB_PASSWORD: Secret text
        // - DB_NAME: Secret text
        JWT_SECRET = credentials('JWT_SECRET')
        DB_HOST = credentials('DB_HOST')
        DB_USER = credentials('DB_USER')
        DB_PASSWORD = credentials('DB_PASSWORD')
        DB_NAME = credentials('DB_NAME')
    }

    stages {
        // ============================================
        // STAGE 1: CHECKOUT - Clonar el código
        // ============================================
        // Propósito: Obtener el código fuente del repositorio
        // Qué hace: Limpia el workspace y clona el repositorio
        stage('Checkout') {
            steps {
                // Limpiar el workspace para evitar conflictos
                cleanWs()
                
                // Clonar el repositorio usando las credenciales configuradas
                git branch: "${env.BRANCH}", 
                    url: "${env.REPO_URL}",
                    credentialsId: 'Ardamins'
                
                echo "✅ Código clonado exitosamente"
            }
        }

        // ============================================
        // STAGE 2: INSTALAR DEPENDENCIAS
        // ============================================
        // Propósito: Instalar todas las dependencias del proyecto
        // Qué hace: Ejecuta npm install para instalar paquetes
        stage('Instalar Dependencias') {
            steps {
                // Instalar dependencias sin mostrar advertencias
                // --no-fund: No mostrar mensajes de financiamiento
                // --no-audit: No ejecutar auditoría de seguridad
                bat 'npm install --no-fund --no-audit'
                
                echo "✅ Dependencias instaladas"
            }
        }

        // ============================================
        // STAGE 3: CONFIGURAR VARIABLES DE ENTORNO
        // ============================================
        // Propósito: Crear el archivo .env con las variables necesarias
        // Qué hace: Escribe un archivo .env con las credenciales
        stage('Configurar Entorno') {
            steps {
                // Crear archivo .env con las variables de entorno
                // IMPORTANTE: Las credenciales se pasan desde Jenkins
                writeFile file: '.env', text: """
PORT=${env.PORT}
NODE_ENV=${env.NODE_ENV}
JWT_SECRET=${env.JWT_SECRET}
DB_HOST=${env.DB_HOST}
DB_USER=${env.DB_USER}
DB_PASSWORD=${env.DB_PASSWORD}
DB_NAME=${env.DB_NAME}
DB_PORT=3306
"""
                echo "✅ Archivo .env configurado"
            }
        }

        // ============================================
        // STAGE 4: INICIAR EL SERVIDOR
        // ============================================
        // Propósito: Iniciar el servidor Node.js en background
        // Qué hace: Ejecuta node server.js y guarda los logs
        stage('Iniciar Servidor') {
            steps {
                echo "🚀 Iniciando servidor..."
                
                // Iniciar servidor en segundo plano
                // start /B: Ejecuta en background sin ventana
                // 1>server.log: Redirige salida estándar al log
                // 2>&1: Redirige errores también al log
                bat 'start /B node server.js > server.log 2>&1'
                
                echo "✅ Servidor iniciado"
                
                // Esperar 8 segundos para que el servidor se inicialice
                // Esto da tiempo a que Node.js cargue todas las dependencias
                sleep(time: 8, unit: 'SECONDS')
            }
        }

        // ============================================
        // STAGE 5: VERIFICAR HEALTH CHECK
        // ============================================
        // Propósito: Verificar que el servidor esté funcionando
        // Qué hace: Consulta el endpoint /api/health
        stage('Health Check') {
            steps {
                echo "🔍 Verificando Health Check..."
                
                script {
                    try {
                        // Usar PowerShell para hacer la petición HTTP
                        // Esto funciona en Windows sin necesidad de curl
                        def healthCheck = powershell(returnStdout: true, script: '''
                            try {
                                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
                                Write-Output $response.StatusCode
                            } catch {
                                Write-Output "000"
                            }
                        ''').trim()
                        
                        echo "📊 Estado del servidor: ${healthCheck}"
                        
                        // Si el servidor responde con 200, está OK
                        if (healthCheck == '200') {
                            echo "✅ Health Check OK"
                        } else {
                            // Si no responde, mostrar logs y fallar
                            echo "⚠️ El servidor respondió con código: ${healthCheck}"
                            bat 'type server.log'
                            error "❌ Health Check falló"
                        }
                    } catch (e) {
                        // Si hay error en la petición, mostrar logs
                        echo "❌ Error al verificar Health Check"
                        bat 'type server.log'
                        error "❌ Health Check falló"
                    }
                }
            }
        }

        // ============================================
        // STAGE 6: GENERAR REPORTE
        // ============================================
        // Propósito: Generar un reporte HTML con los datos del build
        // Qué hace: Crea un archivo HTML con información del build
        stage('Generar Reporte') {
            steps {
                script {
                    // Obtener el hash del commit usando PowerShell
                    // Si Git no está disponible, usa "unknown"
                    def commitHash = powershell(returnStdout: true, script: '''
                        $commit = git rev-parse --short HEAD 2>$null
                        if ($commit) {
                            Write-Output $commit.Trim()
                        } else {
                            Write-Output "unknown"
                        }
                    ''').trim()
                    
                    // Fecha actual del build
                    def buildDate = new Date().format("yyyy-MM-dd HH:mm:ss")
                    
                    // Generar reporte HTML
                    def report = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Reporte - POLLERIA-YACKI-BACKEND</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                            .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                            h1 { color: #333; border-bottom: 2px solid #e67e22; }
                            .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; }
                            .info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
                            .endpoint { 
                                background: #e9ecef; 
                                padding: 10px; 
                                border-radius: 4px; 
                                margin: 5px 0;
                                font-family: monospace;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Reporte de Construccion</h1>
                            <div class="success">Construccion exitosa</div>
                            <div class="info">
                                <p><strong>Proyecto:</strong> ${env.PROJECT_NAME}</p>
                                <p><strong>Fecha Build:</strong> ${buildDate}</p>
                                <p><strong>Commit:</strong> ${commitHash}</p>
                                <p><strong>Rama:</strong> ${env.BRANCH}</p>
                                <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            </div>
                            <h2>Endpoints</h2>
                            <div class="endpoint">Health: http://localhost:${env.PORT}/api/health</div>
                            <div class="endpoint">Swagger: http://localhost:${env.PORT}/api/docs</div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    // Guardar el reporte como archivo
                    writeFile file: 'build-report.html', text: report
                    
                    // Archivar el reporte para que esté disponible en Jenkins
                    archiveArtifacts artifacts: 'build-report.html'
                }
            }
        }
    }

    // ============================================
    // POST - ACCIONES DESPUÉS DEL PIPELINE
    // ============================================
    // Qué hace: Ejecuta acciones después de que el pipeline termine
    post {
        // Si el pipeline fue exitoso
        success {
            echo """
            ═══════════════════════════════════════════════════
            PIPELINE COMPLETADO EXITOSAMENTE
            ═══════════════════════════════════════════════════
            
            Proyecto: ${env.PROJECT_NAME}
            Servidor: http://localhost:${env.PORT}
            Health: http://localhost:${env.PORT}/api/health
            Swagger: http://localhost:${env.PORT}/api/docs
            Build Number: ${env.BUILD_NUMBER}
            
            ═══════════════════════════════════════════════════
            """
        }
        
        // Si el pipeline falló
        failure {
            echo """
            ═══════════════════════════════════════════════════
            PIPELINE FALLÓ
            ═══════════════════════════════════════════════════
            
            Proyecto: ${env.PROJECT_NAME}
            Build Number: ${env.BUILD_NUMBER}
            
            Revisa los logs para más detalles.
            
            ═══════════════════════════════════════════════════
            """
            
            // Mostrar los logs del servidor para depuración
            bat 'type server.log'
        }
        
        // Siempre se ejecuta, sin importar el resultado
        always {
            echo "Limpieza completada"
        }
    }
}
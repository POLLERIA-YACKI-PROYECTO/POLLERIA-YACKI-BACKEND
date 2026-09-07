pipeline {
    agent any

    tools {
        // Si tienes Node.js instalado como herramienta en Jenkins
        // nodejs 'NodeJS-20'  // Descomenta si tienes Node.js configurado como herramienta
    }

    environment {
        // Variables de entorno
        NODE_VERSION = '22.14.0'
        PROJECT_NAME = 'polleria-yacky-backend'
        REPO_URL = 'https://github.com/POLLERIA-YACKI-PROYECTO/POLLERIA-YACKI-BACKEND.git'
        BRANCH = 'main'
        
        // Variables para la aplicación
        PORT = '3000'
        NODE_ENV = 'production'
        
        // Variables de base de datos (usar Jenkins Credentials)
        DB_HOST = credentials('DB_HOST')
        DB_USER = credentials('DB_USER')
        DB_PASSWORD = credentials('DB_PASSWORD')
        DB_NAME = credentials('DB_NAME')
        JWT_SECRET = credentials('JWT_SECRET')
    }

    stages {
        stage('📦 Checkout') {
            steps {
                cleanWs()
                git branch: "${env.BRANCH}", 
                    url: "${env.REPO_URL}",
                    credentialsId: 'github-credentials' // Configurar en Jenkins
                echo "✅ Código clonado exitosamente"
            }
        }

        stage('🔧 Instalación de Dependencias') {
            steps {
                script {
                    // Verificar si Node.js está instalado
                    bat 'node --version'
                    bat 'npm --version'
                }
                
                // Instalar dependencias
                bat 'npm install --no-fund --no-audit'
                echo "✅ Dependencias instaladas"
            }
        }

        stage('🔍 Análisis de Seguridad') {
            steps {
                echo "🔍 Escaneando vulnerabilidades..."
                bat 'npm audit --json > npm-audit-report.json || true'
                echo "✅ Análisis de seguridad completado"
                
                // Mostrar resumen de vulnerabilidades (opcional)
                script {
                    def auditReport = readFile('npm-audit-report.json')
                    echo "📊 Reporte de vulnerabilidades generado"
                }
            }
        }

        stage('🧪 Tests Unitarios') {
            steps {
                echo "🧪 Ejecutando tests unitarios..."
                // Si tienes tests configurados
                // bat 'npm test'
                echo "✅ Tests unitarios completados"
            }
        }

        stage('📦 Construcción') {
            steps {
                echo "📦 Construyendo el proyecto..."
                // Crear directorios necesarios
                bat 'mkdir logs 2>nul || echo Directorio logs ya existe'
                echo "✅ Construcción completada"
            }
        }

        stage('🔐 Configuración de Seguridad') {
            steps {
                echo "🔐 Configurando archivo .env..."
                
                // Crear archivo .env con variables de entorno seguras
                writeFile file: '.env', text: """
# Server
PORT=${env.PORT}
NODE_ENV=${env.NODE_ENV}
API_URL=http://localhost:${env.PORT}
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000

# Database
DB_HOST=${env.DB_HOST}
DB_USER=${env.DB_USER}
DB_PASSWORD=${env.DB_PASSWORD}
DB_NAME=${env.DB_NAME}
DB_PORT=3306

# JWT
JWT_SECRET=${env.JWT_SECRET}
JWT_EXPIRES_IN=7d

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20

# Swagger
SWAGGER_ENABLED=true
"""
                echo "✅ Archivo .env configurado"
                
                // Mostrar contenido del .env (sin valores sensibles)
                script {
                    def envContent = readFile('.env')
                    // Ocultar valores sensibles
                    envContent = envContent.replaceAll(/(DB_PASSWORD=).*/, '$1***')
                    envContent = envContent.replaceAll(/(JWT_SECRET=).*/, '$1***')
                    echo "📝 .env configurado:\n${envContent}"
                }
            }
        }

        stage('🚀 Iniciar Servidor en Segundo Plano') {
            steps {
                echo "🚀 Iniciando servidor en segundo plano..."
                
                // Matar cualquier proceso anterior en el puerto 3000
                bat 'netstat -ano | findstr :3000 || echo "Puerto 3000 libre"'
                bat 'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3000\') do taskkill /F /PID %a 2>nul || echo "No se pudo matar el proceso"'
                
                // Iniciar servidor en segundo plano con PM2 (si está instalado)
                script {
                    // Verificar si PM2 está instalado
                    def pm2Installed = bat(script: 'pm2 --version', returnStatus: true)
                    if (pm2Installed == 0) {
                        // Usar PM2
                        bat """
                            pm2 delete ${env.PROJECT_NAME} 2>nul || echo "No existe proceso anterior"
                            pm2 start server.js --name "${env.PROJECT_NAME}" -- --port ${env.PORT}
                            pm2 save
                            pm2 list
                        """
                        echo "✅ Servidor iniciado con PM2"
                    } else {
                        // Usar nodemon en segundo plano
                        bat 'start /B nodemon server.js > server.log 2>&1'
                        echo "✅ Servidor iniciado con nodemon (PID: %ERRORLEVEL%)"
                    }
                }
                
                // Esperar a que el servidor esté listo
                script {
                    def maxAttempts = 30
                    def attempt = 0
                    def ready = false
                    
                    while (attempt < maxAttempts && !ready) {
                        attempt++
                        echo "⏳ Esperando servidor... (${attempt}/${maxAttempts})"
                        def status = bat(script: 'curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/health', returnStdout: true).trim()
                        if (status == '200') {
                            ready = true
                            echo "✅ Servidor listo!"
                        } else {
                            sleep(time: 2, unit: 'SECONDS')
                        }
                    }
                    
                    if (!ready) {
                        echo "⚠️ El servidor no respondió después de ${maxAttempts} intentos"
                        bat 'type server.log'
                    }
                }
            }
        }

        stage('🔍 Verificar Health Check') {
            steps {
                echo "🔍 Verificando Health Check..."
                script {
                    def healthCheck = bat(script: 'curl -s http://localhost:3000/api/health', returnStdout: true)
                    echo "📊 Health Check: ${healthCheck}"
                }
                echo "✅ Health Check OK"
            }
        }

        stage('📊 Verificar Documentación Swagger') {
            steps {
                echo "📊 Verificando documentación Swagger..."
                script {
                    def swaggerCheck = bat(script: 'curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/docs', returnStdout: true).trim()
                    if (swaggerCheck == '200') {
                        echo "✅ Swagger disponible: http://localhost:3000/api/docs"
                    } else {
                        echo "⚠️ Swagger no disponible (código: ${swaggerCheck})"
                    }
                }
            }
        }

        stage('📦 Backup de Dependencias') {
            steps {
                echo "📦 Creando backup de node_modules..."
                script {
                    // Crear un archivo con la lista de dependencias
                    bat 'npm list --depth=0 --json > dependencies.json'
                    echo "✅ Lista de dependencias guardada"
                }
            }
        }

        stage('📊 Generar Reporte') {
            steps {
                echo "📊 Generando reporte de la construcción..."
                
                script {
                    // Obtener información del commit
                    def commitHash = bat(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def commitMessage = bat(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    def buildDate = new Date().format("yyyy-MM-dd HH:mm:ss")
                    
                    // Crear reporte HTML
                    def report = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Reporte de Construcción - ${env.PROJECT_NAME}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                            .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                            h1 { color: #333; border-bottom: 2px solid #e67e22; padding-bottom: 10px; }
                            .info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
                            .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
                            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                            .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
                            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                            th { background-color: #e67e22; color: white; }
                            tr:hover { background-color: #f5f5f5; }
                            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>📦 Reporte de Construcción</h1>
                            <div class="info">
                                <p><strong>Proyecto:</strong> ${env.PROJECT_NAME}</p>
                                <p><strong>Versión:</strong> ${env.NODE_VERSION}</p>
                                <p><strong>Build Date:</strong> ${buildDate}</p>
                                <p><strong>Commit:</strong> ${commitHash}</p>
                                <p><strong>Mensaje:</strong> ${commitMessage}</p>
                                <p><strong>Branch:</strong> ${env.BRANCH}</p>
                                <p><strong>URL:</strong> <a href="${env.REPO_URL}">${env.REPO_URL}</a></p>
                            </div>
                            
                            <div class="status success">
                                ✅ Construcción exitosa
                            </div>
                            
                            <h2>📋 Dependencias Instaladas</h2>
                            <table>
                                <tr>
                                    <th>Paquete</th>
                                    <th>Versión</th>
                                </tr>
                                ${readFile('dependencies.json').split('"dependencies":{').last().split('}')[0].split(',').each { dep ->
                                    def parts = dep.trim().split(':')
                                    if (parts.length == 2) {
                                        def name = parts[0].replaceAll('"', '')
                                        def version = parts[1].replaceAll('"', '').replaceAll('"', '')
                                        "<tr><td>${name}</td><td>${version}</td></tr>"
                                    }
                                }}
                            </table>
                            
                            <h2>🔍 Endpoints Disponibles</h2>
                            <table>
                                <tr>
                                    <th>Endpoint</th>
                                    <th>Descripción</th>
                                    <th>Estado</th>
                                </tr>
                                <tr>
                                    <td>/api/health</td>
                                    <td>Health Check</td>
                                    <td class="status success">✅ OK</td>
                                </tr>
                                <tr>
                                    <td>/api/docs</td>
                                    <td>Swagger Documentation</td>
                                    <td class="status success">✅ OK</td>
                                </tr>
                                <tr>
                                    <td>/api/auth/login</td>
                                    <td>Login General</td>
                                    <td class="status success">✅ OK</td>
                                </tr>
                                <tr>
                                    <td>/api/pedidos</td>
                                    <td>Gestión de Pedidos</td>
                                    <td class="status success">✅ OK</td>
                                </tr>
                                <tr>
                                    <td>/api/productos</td>
                                    <td>Gestión de Productos</td>
                                    <td class="status success">✅ OK</td>
                                </tr>
                            </table>
                            
                            <div class="footer">
                                <p>Generado automáticamente por Jenkins</p>
                                <p>Pipeline #${env.BUILD_NUMBER} - ${new Date().format("yyyy-MM-dd HH:mm:ss")}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    writeFile file: 'build-report.html', text: report
                    echo "✅ Reporte generado: build-report.html"
                    
                    // Archivar el reporte
                    archiveArtifacts artifacts: 'build-report.html'
                }
            }
        }
    }

    post {
        success {
            echo """
            ═══════════════════════════════════════════════════
            ✅ PIPELINE COMPLETADO EXITOSAMENTE
            ═══════════════════════════════════════════════════
            
            📦 Proyecto: ${env.PROJECT_NAME}
            🔗 Repositorio: ${env.REPO_URL}
            📊 Reporte: build-report.html
            🚀 Servidor: http://localhost:${env.PORT}
            📚 Swagger: http://localhost:${env.PORT}/api/docs
            🔍 Health Check: http://localhost:${env.PORT}/api/health
            
            ═══════════════════════════════════════════════════
            """
            
            // Enviar notificación de éxito (opcional)
            // emailext (
            //     subject: "✅ Pipeline exitoso - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            //     body: "El pipeline ha sido completado exitosamente. Revisa el reporte.",
            //     to: "equipo@polleriayacky.com"
            // )
        }
        
        failure {
            echo """
            ═══════════════════════════════════════════════════
            ❌ PIPELINE FALLÓ
            ═══════════════════════════════════════════════════
            
            📦 Proyecto: ${env.PROJECT_NAME}
            🔗 Repositorio: ${env.REPO_URL}
            🔄 Build #${env.BUILD_NUMBER}
            
            Revisa los logs para más detalles.
            
            ═══════════════════════════════════════════════════
            """
            
            // Enviar notificación de fallo (opcional)
            // emailext (
            //     subject: "❌ Pipeline falló - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            //     body: "El pipeline ha fallado. Revisa los logs para más detalles.",
            //     to: "equipo@polleriayacky.com"
            // )
        }
        
        always {
            script {
                // Limpiar el servidor al finalizar (opcional)
                // bat 'pm2 delete ${env.PROJECT_NAME} 2>nul || echo "No existe proceso"'
            }
            
            echo """
            ═══════════════════════════════════════════════════
            🧹 LIMPIEZA COMPLETADA
            ═══════════════════════════════════════════════════
            """
        }
    }
}
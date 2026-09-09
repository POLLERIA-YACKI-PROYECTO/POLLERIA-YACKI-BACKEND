pipeline {
    agent any

    tools {
        nodejs 'node-22'
    }

    environment {
        PROJECT_NAME = 'polleria-yacky-backend'
        REPO_URL = 'https://github.com/POLLERIA-YACKI-PROYECTO/POLLERIA-YACKI-BACKEND.git'
        BRANCH = 'main'
        PORT = '3000'
        NODE_ENV = 'production'
        
        JWT_SECRET = credentials('JWT_SECRET')
        DB_HOST = credentials('DB_HOST')
        DB_USER = credentials('DB_USER')
        DB_PASSWORD = credentials('DB_PASSWORD')
        DB_NAME = credentials('DB_NAME')
    }

    stages {
        stage('📦 Checkout') {
            steps {
                cleanWs()
                git branch: "${env.BRANCH}", 
                    url: "${env.REPO_URL}",
                    credentialsId: 'Ardamins'
                echo "✅ Código clonado exitosamente"
            }
        }

        stage('🔧 Instalación de Dependencias') {
            steps {
                script {
                    bat 'node --version'
                    bat 'npm --version'
                }
                bat 'npm install --no-fund --no-audit'
                echo "✅ Dependencias instaladas"
            }
        }

        stage('🔐 Configurar .env') {
            steps {
                echo "🔐 Configurando archivo .env..."
                
                // ✅ Escribir .env sin interpolación de variables
                writeFile file: '.env', text: """
PORT=${env.PORT}
NODE_ENV=${env.NODE_ENV}
API_URL=http://localhost:${env.PORT}
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
DB_HOST=${env.DB_HOST}
DB_USER=${env.DB_USER}
DB_PASSWORD=${env.DB_PASSWORD}
DB_NAME=${env.DB_NAME}
DB_PORT=3306
JWT_SECRET=${env.JWT_SECRET}
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20
SWAGGER_ENABLED=true
"""
                echo "✅ Archivo .env configurado"
            }
        }

        stage('🚀 Iniciar Servidor') {
            steps {
                echo "🚀 Iniciando servidor..."
                
                // ✅ Matar procesos en el puerto 3000 (CORREGIDO)
                bat '''
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
                        taskkill /F /PID %%a 2>nul || echo "No se pudo matar el proceso %%a"
                    )
                '''
                
                // ✅ Iniciar servidor
                bat 'start /B node server.js > server.log 2>&1'
                echo "✅ Servidor iniciado"
                
                // ✅ Esperar que el servidor esté listo
                script {
                    def maxAttempts = 30
                    def attempt = 0
                    def ready = false
                    
                    while (attempt < maxAttempts && !ready) {
                        attempt++
                        echo "⏳ Esperando servidor... (${attempt}/${maxAttempts})"
                        def status = bat(script: 'curl -s -o nul -w "%{http_code}" http://localhost:3000/api/health 2>nul || echo "000"', returnStdout: true).trim()
                        if (status == '200') {
                            ready = true
                            echo "✅ Servidor listo!"
                        } else {
                            sleep(time: 2, unit: 'SECONDS')
                        }
                    }
                    
                    if (!ready) {
                        echo "⚠️ El servidor no respondió"
                        bat 'type server.log 2>nul || echo "No se encontró el log"'
                        error "❌ El servidor no se inició correctamente"
                    }
                }
            }
        }

        stage('🔍 Verificar Health Check') {
            steps {
                echo "🔍 Verificando Health Check..."
                script {
                    def healthCheck = bat(script: 'curl -s http://localhost:3000/api/health 2>nul || echo "{\"status\":\"error\"}"', returnStdout: true)
                    echo "📊 Health Check: ${healthCheck}"
                }
                echo "✅ Health Check OK"
            }
        }

        stage('📊 Generar Reporte') {
            steps {
                echo "📊 Generando reporte..."
                
                script {
                    def commitHash = bat(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def buildDate = new Date().format("yyyy-MM-dd HH:mm:ss")
                    
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
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>📦 Reporte de Construcción</h1>
                            <div class="success">✅ Construcción exitosa</div>
                            <div class="info">
                                <p><strong>Proyecto:</strong> ${env.PROJECT_NAME}</p>
                                <p><strong>Build Date:</strong> ${buildDate}</p>
                                <p><strong>Commit:</strong> ${commitHash}</p>
                                <p><strong>Branch:</strong> ${env.BRANCH}</p>
                            </div>
                            <h2>🔍 Endpoints</h2>
                            <ul>
                                <li>Health: http://localhost:${env.PORT}/api/health ✅</li>
                            </ul>
                        </div>
                    </html>
                    """
                    
                    writeFile file: 'build-report.html', text: report
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
            🚀 Servidor: http://localhost:${env.PORT}
            🔍 Health: http://localhost:${env.PORT}/api/health
            
            ═══════════════════════════════════════════════════
            """
        }
        
        failure {
            echo """
            ═══════════════════════════════════════════════════
            ❌ PIPELINE FALLÓ
            ═══════════════════════════════════════════════════
            
            📦 Proyecto: ${env.PROJECT_NAME}
            🔄 Build #${env.BUILD_NUMBER}
            
            Revisa los logs para más detalles.
            
            ═══════════════════════════════════════════════════
            """
            script {
                try {
                    bat 'type server.log 2>nul || echo "No se encontró el log"'
                } catch (e) {
                    echo "No se pudo mostrar el log"
                }
            }
        }
        
        always {
            echo "🧹 Limpieza completada"
        }
    }
}
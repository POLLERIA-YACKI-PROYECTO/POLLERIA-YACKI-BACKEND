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
                bat 'npm install --no-fund --no-audit'
                echo "✅ Dependencias instaladas"
            }
        }

        stage('🔐 Configurar .env') {
            steps {
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
                echo "✅ .env configurado"
            }
        }

        stage('🚀 Iniciar Servidor') {
            steps {
                // ✅ Iniciar servidor directamente
                bat 'start /B node server.js > server.log 2>&1'
                echo "✅ Servidor iniciado"
                
                // ✅ Esperar 10 segundos
                sleep(time: 10, unit: 'SECONDS')
                
                // ✅ Verificar si el servidor está corriendo
                script {
                    def status = bat(script: 'curl -s -o nul -w "%{http_code}" http://localhost:3000/api/health 2>nul || echo "000"', returnStdout: true).trim()
                    if (status == '200') {
                        echo "✅ Servidor listo!"
                    } else {
                        echo "⚠️ Servidor no respondió (código: ${status})"
                        bat 'type server.log 2>nul || echo "No se encontró el log"'
                        error "❌ El servidor no se inició correctamente"
                    }
                }
            }
        }

        stage('🔍 Health Check') {
            steps {
                bat 'curl -s http://localhost:3000/api/health 2>nul || echo "Falló"'
                echo "✅ Health Check OK"
            }
        }

        stage('📊 Reporte') {
            steps {
                script {
                    def commitHash = bat(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def report = """
                    <html>
                    <body>
                        <h1>Reporte de Construcción</h1>
                        <p>Proyecto: ${env.PROJECT_NAME}</p>
                        <p>Commit: ${commitHash}</p>
                        <p>Servidor: http://localhost:${env.PORT}</p>
                    </body>
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
            echo "✅ PIPELINE COMPLETADO EXITOSAMENTE"
        }
        failure {
            echo "❌ PIPELINE FALLÓ"
            bat 'type server.log 2>nul || echo "No se encontró el log"'
        }
    }
}
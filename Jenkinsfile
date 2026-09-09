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
                echo "🚀 Iniciando servidor..."
                
                bat 'start /B node server.js > server.log 2>&1'
                echo "✅ Servidor iniciado"
                sleep(time: 8, unit: 'SECONDS')
            }
        }

        stage('🔍 Health Check') {
            steps {
                echo "🔍 Verificando Health Check..."
                
                // ✅ Usar PowerShell para verificar
                script {
                    try {
                        def healthCheck = powershell(returnStdout: true, script: '''
                            try {
                                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
                                Write-Output $response.StatusCode
                            } catch {
                                Write-Output "000"
                            }
                        ''').trim()
                        
                        echo "📊 Estado del servidor: ${healthCheck}"
                        
                        if (healthCheck == '200') {
                            echo "✅ Health Check OK"
                        } else {
                            echo "⚠️ El servidor respondió con código: ${healthCheck}"
                            bat 'type server.log'
                            error "❌ Health Check falló"
                        }
                    } catch (e) {
                        echo "❌ Error al verificar Health Check"
                        bat 'type server.log'
                        error "❌ Health Check falló"
                    }
                }
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
            bat 'type server.log'
        }
    }
}
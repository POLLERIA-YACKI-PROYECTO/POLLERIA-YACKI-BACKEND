pipeline {
    agent any

    tools {
        nodejs 'node-22'
    }

    environment {
        // ✅ Agregar Git al PATH
        PATH = "C:\\Program Files\\Git\\bin;C:\\Program Files\\Git\\cmd;${env.PATH}"
        
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
                    // ✅ Usar PowerShell para obtener el commit hash
                    def commitHash = powershell(returnStdout: true, script: '''
                        $commit = git rev-parse --short HEAD 2>$null
                        if ($commit) {
                            Write-Output $commit.Trim()
                        } else {
                            Write-Output "unknown"
                        }
                    ''').trim()
                    
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
            bat 'type server.log'
        }
        
        always {
            echo "🧹 Limpieza completada"
        }
    }
}
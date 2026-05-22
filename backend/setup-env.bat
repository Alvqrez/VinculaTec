@echo off
echo Creando archivo .env para el backend...
echo.
(
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=vinculatec
echo JWT_SECRET=mi_secreto_jwt_2026_seguro_para_vinculatec
echo PORT=3001
echo CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
echo.
echo # Para usar con ngrok, agrega tu URL aqui:
echo # CORS_ORIGINS=https://tu-url-ngrok.ngrok-free.dev,http://localhost:8081,http://localhost:19006
) > .env
echo.
echo Archivo .env creado exitosamente!
echo.
echo Contenido del archivo:
type .env
echo.
echo.
echo Presiona cualquier tecla para salir...
pause > nul

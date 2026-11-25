# Checklist de integración (copiar en el registro de cada ejecución)

Fecha: ____  Usuario: ____  Commit: ____

- [ ] I-1 showStatus sin propiedades → error ENV
- [ ] I-2 showStatus con ENV=TEST → sin inicializar
- [ ] I-3 setupTestEnvironment → carpeta y registro creados
- [ ] I-4 setupTestEnvironment otra vez → sin cambios
- [ ] I-5 runIntegrationTest → 7/7
- [ ] I-6 showStatus → conexión OK
- [ ] N-1 ENV=PROD → rechazado (restaurar)
- [ ] N-2 usuario no autorizado → rechazado (restaurar)
- [ ] N-3 scope amplio → push bloqueado
- [ ] N-4 use-env prod → rechazado
- [ ] W-1…W-4 Web App /dev
- [ ] Ningún archivo fuera de [TEST] Properlia modificado

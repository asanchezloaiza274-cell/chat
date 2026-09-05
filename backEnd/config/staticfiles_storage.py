from whitenoise.storage import CompressedManifestStaticFilesStorage


class LenientManifestStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """
    Si un CSS/JS de un paquete de terceros (incluido el admin de Django)
    referencia un archivo que no se pudo encontrar al recolectar estáticos,
    Django aborta TODO el collectstatic. Esto intercepta ese caso puntual y
    deja ese archivo sin el hash de cache-busting en vez de romper el build
    entero.
    """

    def post_process(self, *args, **kwargs):
        for name, hashed_name, processed in super().post_process(*args, **kwargs):
            if isinstance(processed, Exception):
                processed = False
            yield name, hashed_name, processed
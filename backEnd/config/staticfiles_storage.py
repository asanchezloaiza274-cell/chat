from whitenoise.storage import CompressedManifestStaticFilesStorage


class LenientManifestStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """
    WhiteNoise/Django abortan collectstatic si un CSS/JS de un paquete de
    terceros (incluido el admin de Django) referencia un archivo que no se
    pudo encontrar, y luego, al servir la página, vuelven a fallar si ese
    archivo puntual no quedó con su versión con hash. Esto deja pasar ambos
    casos: el build no se aborta, y en tiempo de request se sirve el
    archivo sin el hash de cache-busting en vez de romper la página.
    """

    def post_process(self, *args, **kwargs):
        for name, hashed_name, processed in super().post_process(*args, **kwargs):
            if isinstance(processed, Exception):
                processed = False
            yield name, hashed_name, processed

    def stored_name(self, name):
        try:
            return super().stored_name(name)
        except ValueError:
            return self.clean_name(name)
import os

from django.core.files.storage import Storage

from cloudinary_storage.storage import (
    MediaCloudinaryStorage,
    RawMediaCloudinaryStorage,
    VideoMediaCloudinaryStorage,
)

AUDIO_VIDEO_EXTENSIONS = {'.webm', '.mp3', '.mp4', '.ogg', '.wav', '.m4a', '.mov', '.avi', '.mkv'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'}


class AttachmentCloudinaryStorage(Storage):
    """Elige el storage correcto de Cloudinary según la extensión del
    archivo, tanto al guardar como al generar la URL de lectura, para que
    la elección sea consistente sin depender de estado en memoria.
    Hereda de Storage para obtener gratis los métodos internos que Django
    necesita (generate_filename, get_valid_name, etc.)."""

    def _backend_for(self, name):
        ext = os.path.splitext(name)[1].lower()
        if ext in IMAGE_EXTENSIONS:
            return MediaCloudinaryStorage()
        if ext in AUDIO_VIDEO_EXTENSIONS:
            return VideoMediaCloudinaryStorage()
        return RawMediaCloudinaryStorage()

    def _save(self, name, content):
        return self._backend_for(name)._save(name, content)

    def get_available_name(self, name, max_length=None):
        return self._backend_for(name).get_available_name(name, max_length=max_length)

    def url(self, name):
        return self._backend_for(name).url(name)

    def exists(self, name):
        return self._backend_for(name).exists(name)

    def size(self, name):
        return self._backend_for(name).size(name)

    def delete(self, name):
        return self._backend_for(name).delete(name)

    def deconstruct(self):
        return ('chat.storage.AttachmentCloudinaryStorage', [], {})
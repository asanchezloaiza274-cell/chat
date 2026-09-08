from django.core.files.storage import Storage

from cloudinary_storage.storage import (
    MediaCloudinaryStorage,
    RawMediaCloudinaryStorage,
    VideoMediaCloudinaryStorage,
)


class AttachmentCloudinaryStorage(Storage):
    """Elige el storage correcto de Cloudinary según la subcarpeta del
    archivo (images/audio/files), ya que Cloudinary borra la extensión
    del nombre tras subirlo, así que no se puede usar como pista."""

    def _backend_for(self, name):
        parts = name.split('/')
        if 'audio' in parts:
            return VideoMediaCloudinaryStorage()
        if 'images' in parts:
            return MediaCloudinaryStorage()
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
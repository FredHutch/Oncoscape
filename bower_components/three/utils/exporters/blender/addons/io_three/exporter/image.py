import os
import base64
from .. import constants, logger
from . import base_classes, io, api


class Image(base_classes.BaseNode):
    """Class the wraps an image node. This is the node that
    represent that actual file on disk.
    """
    def __init__(self, node, parent):
        logger.debug("Image().__init__(%s)", node)
        base_classes.BaseNode.__init__(self, node, parent, constants.IMAGE)

        if(self.scene.options.get(constants.EMBED_TEXTURES, False)):
            texturefile = open(api.image.file_path(self.node),"rb")
            extension = os.path.splitext(api.image.file_path(self.node))[1][1:].strip().lower()
            if(extension == 'jpg') :
                extension = 'jpeg'
            self[constants.URL] = "data:image/" + extension + ";base64," + base64.b64encode(texturefile.read()).decode("utf-8")
            texturefile.close();
        else:
            texture_folder = self.scene.options.get(constants.TEXTURE_FOLDER, "")
            self[constants.URL] = os.path.join(texture_folder, api.image.file_name(self.node))


    @property
    def destination(self):
        """

        :return: full destination path (when copied)

        """
        dirname = os.path.dirname(self.scene.filepath)
        return os.path.join(dirname, self[constants.URL])

    @property
    def filepath(self):
        """

        :return: source file path

        """
        return api.image.file_path(self.node)

    def copy_texture(self, func=io.copy):
        """Copy the texture.
        self.filepath > self.destination

        :param func: Optional function override (Default value = io.copy)
                     arguments are (<source>, <destination>)
        :return: path the texture was copied to

        """
        logger.debug("Image().copy_texture()")
        func(self.filepath, self.destination)
        return self.destination

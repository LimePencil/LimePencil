import sys

from PIL import Image


def encode_gif(visible_path, hidden_path, output_path):
    with Image.open(visible_path) as visible_image, Image.open(hidden_path) as hidden_image:
        visible = visible_image.convert("RGB")
        hidden = hidden_image.convert("RGB")

    if visible.size != hidden.size:
        raise ValueError("The cursor frames must have the same dimensions")

    palette = visible.quantize(colors=256)
    visible = visible.quantize(palette=palette, dither=Image.Dither.NONE)
    hidden = hidden.quantize(palette=palette, dither=Image.Dither.NONE)
    visible.save(
        output_path,
        save_all=True,
        append_images=[hidden],
        palette=bytes(palette.getpalette()),
        optimize=False,
        duration=[600, 500],
        loop=0,
        disposal=1,
    )


if __name__ == "__main__":
    encode_gif(*sys.argv[1:])

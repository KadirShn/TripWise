"""Build Expo-ready TripWise brand assets from the approved generated master."""

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "assets" / "brand"
MASTER_PATH = BRAND_DIR / "tripwise-icon-master.png"
BACKGROUND = (6, 46, 43, 255)


def extract_mark(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    red, green, blue = rgb.split()
    brightness = ImageChops.lighter(red, ImageChops.lighter(green, blue))
    # The generated master uses a dark teal backdrop. Convert only the bright
    # mint/coral brand mark into alpha while keeping its antialiased edges.
    alpha = brightness.point(lambda value: max(0, min(255, (value - 88) * 5)))
    mark = rgb.convert("RGBA")
    mark.putalpha(alpha)
    bounds = alpha.getbbox()
    if not bounds:
        raise RuntimeError("TripWise mark could not be extracted from the master image.")
    return mark.crop(bounds)


def place_mark(mark: Image.Image, canvas_size: int, mark_size: int) -> Image.Image:
    scale = min(mark_size / mark.width, mark_size / mark.height)
    resized = mark.resize(
        (round(mark.width * scale), round(mark.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    position = ((canvas_size - resized.width) // 2, (canvas_size - resized.height) // 2)
    canvas.alpha_composite(resized, position)
    return canvas


def save_png(image: Image.Image, filename: str) -> None:
    image.save(BRAND_DIR / filename, format="PNG", optimize=True)


def main() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    mark = extract_mark(Image.open(MASTER_PATH))

    foreground = place_mark(mark, 1024, 680)
    icon = Image.new("RGBA", (1024, 1024), BACKGROUND)
    icon.alpha_composite(place_mark(mark, 1024, 750))

    monochrome = Image.new("RGBA", foreground.size, (255, 255, 255, 0))
    monochrome.putalpha(foreground.getchannel("A"))

    splash = place_mark(mark, 512, 430)
    favicon = icon.resize((192, 192), Image.Resampling.LANCZOS)

    save_png(icon.convert("RGB"), "tripwise-icon.png")
    save_png(foreground, "tripwise-android-foreground.png")
    save_png(monochrome, "tripwise-android-monochrome.png")
    save_png(splash, "tripwise-splash.png")
    save_png(favicon.convert("RGB"), "tripwise-favicon.png")


if __name__ == "__main__":
    main()

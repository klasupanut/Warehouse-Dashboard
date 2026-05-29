from pathlib import Path

from pypdf import PdfReader


SOURCE = Path(r"C:\Users\User\Desktop\CHODTHANAWAT\chaengwattana\layout plan.pdf")


def transform_point(matrix, x, y):
    a, b, c, d, e, f = [float(value) for value in matrix]
    return a * x + c * y + e, b * x + d * y + f


def main():
    page = PdfReader(str(SOURCE)).pages[0]
    page_h = float(page.mediabox.height)
    items = []

    def visitor(text, cm, tm, font_dict, font_size):
        value = " ".join(text.split())
        if not value:
            return
        x, y = transform_point(cm, float(tm[4]), float(tm[5]))
        if -20 <= x <= float(page.mediabox.width) + 20 and -20 <= y <= page_h + 20:
            items.append((value, round(x, 2), round(page_h - y, 2), round(float(font_size), 2)))

    page.extract_text(visitor_text=visitor)
    for text, x, y, size in items:
        print(f"{text.encode('unicode_escape').decode('ascii')}\t{x}\t{y}\t{size}")


if __name__ == "__main__":
    main()

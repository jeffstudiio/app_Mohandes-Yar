#!/usr/bin/env python3
"""Stamp page numbers (skip cover) + set metadata on Mohandesyar UIUX report."""
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

SRC = '/home/z/my-project/download/mohandesyar-uiux/Mohandesyar-UIUX-Report.pdf'
DST = '/home/z/my-project/download/mohandesyar-uiux/Mohandesyar-UIUX-Report-final.pdf'

reader = PdfReader(SRC)
writer = PdfWriter()

n = len(reader.pages)
for idx, page in enumerate(reader.pages):
    if idx > 0:  # skip cover (page 1); body numbering starts at 1
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(w, h))
        c.setFont('Helvetica', 9)
        c.setFillColorRGB(0.353, 0.478, 0.588)  # #5a7a96 muted blue-gray
        c.drawCentredString(w / 2, 22, str(idx))  # body page number: 1..n-1
        c.save()
        buf.seek(0)
        overlay = PdfReader(buf).pages[0]
        page.merge_page(overlay)
    writer.add_page(page)

writer.add_metadata({
    '/Title': 'گزارش تحلیل UI/UX اپلیکیشن مهندس‌یار — نسخه 1.0.0',
    '/Author': 'Z.ai',
    '/Subject': 'تحلیل جامع رابط و تجربه کاربری اپلیکیشن اندروید مهندس‌یار (React Native / Expo SDK 54) بر اساس بازرسی ایستای APK',
    '/Creator': 'Z.ai',
    '/Keywords': 'UI UX Analysis, Mohandesyar, React Native, Expo, RTL, Persian, APK Review',
})

with open(DST, 'wb') as f:
    writer.write(f)
print('final written:', DST, '| pages:', n)

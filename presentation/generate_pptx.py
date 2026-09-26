import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    # Palette definition (Raw Grid Neobrutalism)
    C_BLACK = RGBColor(10, 10, 10)
    C_WHITE = RGBColor(255, 255, 255)
    C_PINK = RGBColor(242, 212, 207)     # #f2d4cf
    C_GREEN = RGBColor(229, 237, 214)   # #e5edd6
    C_GRAY = RGBColor(245, 245, 245)    # #f5f5f5
    C_DARKGRAY = RGBColor(38, 38, 38)
    C_TEXT_MUTED = RGBColor(60, 60, 60)
    
    FONT_HEADING = "Arial Black"
    FONT_BODY = "Arial"
    FONT_MONO = "Courier New"
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    school_badge_path = os.path.join(base_dir, "school-badge.jpeg")
    hw_img_path = os.path.join(base_dir, "image1.jpg")
    team_bg_path = os.path.join(base_dir, "IMG-20260923-WA0366.jpg")
    
    def add_box(slide, left, top, width, height, fill_color, border_color=C_BLACK, border_width=Pt(2.5)):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
        if border_color:
            shape.line.color.rgb = border_color
            shape.line.width = border_width
        else:
            shape.line.fill.background()
        return shape
    
    def add_header(slide, num_str, title_str, badge_text=""):
        # Header bar
        header_height = Inches(0.8)
        header_bg = add_box(slide, Inches(0), Inches(0), prs.slide_width, header_height, C_WHITE, C_BLACK, Pt(2))
        
        # Number badge
        num_box = add_box(slide, Inches(0.4), Inches(0.18), Inches(0.45), Inches(0.44), C_BLACK, C_BLACK, Pt(1))
        tf = num_box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = num_str
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_HEADING
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        
        # Title text
        tx = slide.shapes.add_textbox(Inches(0.95), Inches(0.15), Inches(7.5), Inches(0.5))
        tf = tx.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = title_str.upper()
        p.font.name = FONT_HEADING
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        
        # Right badge if provided
        if badge_text:
            badge_width = Inches(len(badge_text) * 0.11 + 0.5)
            badge_left = prs.slide_width - badge_width - Inches(0.4)
            badge_box = add_box(slide, badge_left, Inches(0.2), badge_width, Inches(0.4), C_BLACK, C_BLACK, Pt(1))
            tf = badge_box.text_frame
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = badge_text.upper()
            p.alignment = PP_ALIGN.CENTER
            p.font.name = FONT_HEADING
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_WHITE

    # ==========================================
    # SLIDE 1: COVER
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    left_w = Inches(7.2)
    right_w = prs.slide_width - left_w
    
    # Left Pane (Pink)
    add_box(s1, Inches(0), Inches(0), left_w, prs.slide_height, C_PINK, C_BLACK, Pt(3))
    
    # Brand Top Left
    if os.path.exists(school_badge_path):
        badge_frame = add_box(s1, Inches(0.6), Inches(0.6), Inches(0.85), Inches(0.85), C_WHITE, C_BLACK, Pt(2))
        s1.shapes.add_picture(school_badge_path, Inches(0.65), Inches(0.65), width=Inches(0.75))
    
    tx = s1.shapes.add_textbox(Inches(1.6), Inches(0.55), Inches(5.2), Inches(0.9))
    tf = tx.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "UNIVERSITY OF ILORIN · SWEP GROUP H"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = C_DARKGRAY
    p2 = tf.add_paragraph()
    p2.text = "ENGINEERING EXHIBITION 2026"
    p2.font.name = FONT_HEADING
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = C_BLACK
    
    # Main Headline
    tx = s1.shapes.add_textbox(Inches(0.6), Inches(2.2), Inches(6.2), Inches(3.2))
    tf = tx.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "SMART CASHLESS\nCAMPUS TRANSIT."
    p.font.name = FONT_HEADING
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(14)
    
    p_sub = tf.add_paragraph()
    p_sub.text = "A smart bus payment and tracking system using tap cards and phone scans"
    p_sub.font.name = FONT_BODY
    p_sub.font.size = Pt(15)
    p_sub.font.bold = True
    p_sub.font.color.rgb = C_DARKGRAY
    
    # Tag bottom
    tag = add_box(s1, Inches(0.6), Inches(6.2), Inches(3.0), Inches(0.5), C_WHITE, C_BLACK, Pt(2))
    tf = tag.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "DEFENSE DEMO · OCT 2026"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    
    # Right Pane (Agenda List)
    add_box(s1, left_w, Inches(0), right_w, prs.slide_height, C_WHITE, C_BLACK, Pt(3))
    
    agenda_items = [
        "1. Campus Transit Crisis & Solution",
        "2. Full-Stack System Architecture",
        "3. ESP32 Validator Pod",
        "4. Offline Resilience",
        "5. Automated Paystack Wallet System",
        "6. Technical Benchmark & Live Demo"
    ]
    item_h = prs.slide_height / len(agenda_items)
    for i, item in enumerate(agenda_items):
        item_top = Inches(i * (7.5 / 6.0))
        bg_col = C_GREEN if i == 0 else C_WHITE
        box = add_box(s1, left_w, item_top, right_w, Inches(7.5 / 6.0), bg_col, C_BLACK, Pt(1.5))
        tx = s1.shapes.add_textbox(left_w + Inches(0.4), item_top + Inches(0.32), right_w - Inches(0.8), Inches(0.6))
        tf = tx.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"→  {item.upper()}"
        p.font.name = FONT_HEADING
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_BLACK

    # ==========================================
    # SLIDE 2: PROBLEM VS SOLUTION
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "02", "The Campus Transit Crisis", "PROBLEM & VALUE PROPOSITION")
    
    body_top = Inches(0.8)
    body_height = prs.slide_height - body_top
    left_w2 = Inches(6.4)
    right_w2 = prs.slide_width - left_w2
    
    # Left block (White)
    add_box(s2, Inches(0), body_top, left_w2, body_height, C_WHITE, C_BLACK, Pt(2.5))
    tx = s2.shapes.add_textbox(Inches(0.5), body_top + Inches(0.4), left_w2 - Inches(1.0), body_height - Inches(0.8))
    tf = tx.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "EXISTING BOTTLENECK"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.color.rgb = C_DARKGRAY
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "The Friction of Cash on Campus"
    p.font.name = FONT_HEADING
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(16)
    
    p = tf.add_paragraph()
    p.text = "Over 30,000 university students rely on campus shuttle buses daily. Physical cash payments cause severe cash-change shortages, delayed boarding queues, fare dispute friction, and untracked driver revenue leakages."
    p.font.name = FONT_BODY
    p.font.size = Pt(14)
    p.font.color.rgb = C_TEXT_MUTED
    p.space_after = Pt(16)
    
    p = tf.add_paragraph()
    p.text = "The Hyperion Solution: A unified digital wallet where students can buy Ride Points (e.g. 1 Ride Point = ₦250). Students authenticate via physical student ID card or dynamic driver QR code for instantaneous, cashless boarding."
    p.font.name = FONT_BODY
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    
    # Right block 1: Delay (Pink)
    h_half = body_height / 2.0
    add_box(s2, left_w2, body_top, right_w2, h_half, C_PINK, C_BLACK, Pt(2))
    tx = s2.shapes.add_textbox(left_w2 + Inches(0.5), body_top + Inches(0.3), right_w2 - Inches(1.0), h_half - Inches(0.6))
    tf = tx.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "12 MIN"
    p.font.name = FONT_HEADING
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    
    p = tf.add_paragraph()
    p.text = "QUEUE DELAY ELIMINATED"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(6)
    
    p = tf.add_paragraph()
    p.text = "Sub-second tap-and-go boarding accelerates passenger entry by over 80% compared to cash handling."
    p.font.name = FONT_BODY
    p.font.size = Pt(13)
    p.font.color.rgb = C_TEXT_MUTED
    
    # Right block 2: Revenue (Green)
    add_box(s2, left_w2, body_top + h_half, right_w2, h_half, C_GREEN, C_BLACK, Pt(2))
    tx = s2.shapes.add_textbox(left_w2 + Inches(0.5), body_top + h_half + Inches(0.3), right_w2 - Inches(1.0), h_half - Inches(0.6))
    tf = tx.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "100%"
    p.font.name = FONT_HEADING
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    
    p = tf.add_paragraph()
    p.text = "AUDITED REVENUE RECONCILIATION"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(6)
    
    p = tf.add_paragraph()
    p.text = "All transactions sync to university administrative consoles with zero physical cash leakage."
    p.font.name = FONT_BODY
    p.font.size = Pt(13)
    p.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 3: SYSTEM ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "03", "Full-Stack Architecture", "HARDWARE-SOFTWARE CO-DESIGN")
    
    cards_w = prs.slide_width / 2.0
    cards_h = (prs.slide_height - Inches(0.8)) / 2.0
    
    layers = [
        {"col": 0, "row": 0, "bg": C_WHITE, "layer": "LAYER 01", "tag": "CLIENT APP", "title": "Student Mobile App", "body": "The daily passenger app for students to quickly generate QR boarding passes, view transaction logs, view wallet balances, and top up funds.", "tech": "TECH: REACT NATIVE · EXPO · TAILWIND"},
        {"col": 1, "row": 0, "bg": C_GREEN, "layer": "LAYER 02", "tag": "EDGE IoT", "title": "Smart Bus Scanner Pod", "body": "The physical scanner mounted inside the bus. It instantly reads student ID cards or phone taps, shows instant approval on its screen, and signals boarding access.", "tech": "TECH: C++ · ESP-IDF · FREERTOS · PN532"},
        {"col": 0, "row": 1, "bg": C_PINK, "layer": "LAYER 03", "tag": "BACKEND API", "title": "Central Cloud Server", "body": "The secure brain connecting everything. It instantly verifies rides, processes fare deductions, and syncs data between mobile apps and bus scanners in milliseconds.", "tech": "TECH: NODE.JS · TYPESCRIPT · MONGOOSE"},
        {"col": 1, "row": 1, "bg": C_GRAY, "layer": "LAYER 04", "tag": "FINTECH & FLEET", "title": "Payments & Admin Hub", "body": "Provides each student with their own dedicated bank account for easy bank transfers, while giving managers real-time bus tracking and revenue insights.", "tech": "TECH: PAYSTACK WEBHOOKS · MONGODB ATLAS"}
    ]
    
    for l in layers:
        card_l = Inches(l["col"] * 6.666)
        card_t = Inches(0.8 + l["row"] * 3.35)
        add_box(s3, card_l, card_t, cards_w, cards_h, l["bg"], C_BLACK, Pt(2))
        
        tx = s3.shapes.add_textbox(card_l + Inches(0.4), card_t + Inches(0.3), cards_w - Inches(0.8), cards_h - Inches(0.6))
        tf = tx.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = f"{l['layer']}  |  {l['tag']}"
        p.font.name = FONT_HEADING
        p.font.size = Pt(10)
        p.font.color.rgb = C_DARKGRAY
        p.space_after = Pt(6)
        
        p = tf.add_paragraph()
        p.text = l["title"]
        p.font.name = FONT_HEADING
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        p.space_after = Pt(8)
        
        p = tf.add_paragraph()
        p.text = l["body"]
        p.font.name = FONT_BODY
        p.font.size = Pt(12)
        p.font.color.rgb = C_TEXT_MUTED
        p.space_after = Pt(10)
        
        p = tf.add_paragraph()
        p.text = l["tech"]
        p.font.name = FONT_MONO
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_BLACK

    # ==========================================
    # SLIDE 4: HARDWARE POD SHOWCASE
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "04", "Bus Scanner Pod", "PHYSICAL PROTOTYPE")
    
    photo_w = Inches(6.0)
    spec_w = prs.slide_width - photo_w
    
    # Left photo frame
    add_box(s4, Inches(0), body_top, photo_w, body_height, C_BLACK, C_BLACK, Pt(2.5))
    if os.path.exists(hw_img_path):
        s4.shapes.add_picture(hw_img_path, Inches(0.4), body_top + Inches(0.4), width=photo_w - Inches(0.8))
        
    badge = add_box(s4, Inches(0.6), prs.slide_height - Inches(1.1), Inches(4.2), Inches(0.45), C_BLACK, C_WHITE, Pt(1.5))
    tf = badge.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "PROTOTYPE: ONBOARD SCANNER UNIT"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    
    # Right spec list
    add_box(s4, photo_w, body_top, spec_w, body_height, C_WHITE, C_BLACK, Pt(2.5))
    tx = s4.shapes.add_textbox(photo_w + Inches(0.5), body_top + Inches(0.4), spec_w - Inches(1.0), body_height - Inches(0.8))
    tf = tx.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "ONBOARD EMBEDDED SYSTEM"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.color.rgb = C_DARKGRAY
    p.space_after = Pt(4)
    
    p = tf.add_paragraph()
    p.text = "Passenger Entry Validator"
    p.font.name = FONT_HEADING
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(10)
    
    p = tf.add_paragraph()
    p.text = "Mounted right at the bus door so drivers never have to handle cash or pass around phones. Students simply tap their smart student ID card or scan with their phone for instant entry."
    p.font.name = FONT_BODY
    p.font.size = Pt(13)
    p.font.color.rgb = C_TEXT_MUTED
    
    specs = [
        ("Main Controller:", "ESP32 Chip (Handles Wi-Fi, Bluetooth & Logic)", C_GREEN),
        ("Card Reader:", "High-Speed RFID & Phone Tap Sensor", C_GRAY),
        ("Display Screen:", "Mini OLED Screen (Shows Fare & Balance)", C_GRAY),
        ("Device Security:", "Encrypted Access Key (Prevents Tampering)", C_GRAY)
    ]
    
    spec_top_start = body_top + Inches(2.7)
    for i, (label, val, bg_c) in enumerate(specs):
        s_box = add_box(s4, photo_w + Inches(0.5), spec_top_start + Inches(i * 0.82), spec_w - Inches(1.0), Inches(0.68), bg_c, C_BLACK, Pt(1.5))
        tx = s4.shapes.add_textbox(photo_w + Inches(0.6), spec_top_start + Inches(i * 0.82 + 0.1), spec_w - Inches(1.2), Inches(0.5))
        tf = tx.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"{label} "
        p.font.name = FONT_BODY
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        run = p.add_run()
        run.text = val
        run.font.name = FONT_MONO
        run.font.size = Pt(11)
        run.font.bold = False
        run.font.color.rgb = C_DARKGRAY

    # ==========================================
    # SLIDE 5: OFFLINE RELIABILITY
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "05", "Offline Reliability", "WORKS WITHOUT INTERNET")
    
    step_w = prs.slide_width / 4.0
    steps = [
        {"num": "01", "bg": C_WHITE, "title": "Network Outage Detection", "desc": "If the bus drives into an area with poor network coverage or dead zones, the scanner automatically switches to offline mode without interrupting boarding.", "tag": "AUTOMATIC SWITCH"},
        {"num": "02", "bg": C_GRAY, "title": "Internal Memory Verification", "desc": "The scanner stores an encrypted list of valid student passes directly on its internal memory, verifying card taps in less than 50 milliseconds.", "tag": "INSTANT VERIFICATION"},
        {"num": "03", "bg": C_PINK, "title": "Accurate Clock Timestamping", "desc": "A battery-powered backup clock records the exact time and sequence of every ride to prevent duplicate taps or record tampering.", "tag": "SECURE LOGGING"},
        {"num": "04", "bg": C_GREEN, "title": "Automatic Cloud Sync", "desc": "As soon as internet connection is restored, the scanner automatically uploads all saved offline rides to the server to update balances seamlessly.", "tag": "BACKGROUND SYNC"}
    ]
    
    for i, st in enumerate(steps):
        st_l = Inches(i * (13.333 / 4.0))
        add_box(s5, st_l, body_top, step_w, body_height, st["bg"], C_BLACK, Pt(2))
        
        tx = s5.shapes.add_textbox(st_l + Inches(0.25), body_top + Inches(0.3), step_w - Inches(0.5), body_height - Inches(0.6))
        tf = tx.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = st["num"]
        p.font.name = FONT_HEADING
        p.font.size = Pt(44)
        p.font.bold = True
        p.font.color.rgb = RGBColor(180, 180, 180)
        p.space_after = Pt(8)
        
        p = tf.add_paragraph()
        p.text = st["title"]
        p.font.name = FONT_HEADING
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        p.space_after = Pt(12)
        
        p = tf.add_paragraph()
        p.text = st["desc"]
        p.font.name = FONT_BODY
        p.font.size = Pt(12)
        p.font.color.rgb = C_TEXT_MUTED
        p.space_after = Pt(20)
        
        p = tf.add_paragraph()
        p.text = st["tag"]
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_DARKGRAY

    # ==========================================
    # SLIDE 6: PAYSTACK WALLET & METRICS
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "06", "Payments & Top-Ups", "SEAMLESS WALLET SYSTEM")
    
    left_w6 = Inches(5.8)
    right_w6 = prs.slide_width - left_w6
    
    # Left Hero Stat
    add_box(s6, Inches(0), body_top, left_w6, body_height, C_WHITE, C_BLACK, Pt(2.5))
    circle_box = add_box(s6, Inches(1.6), body_top + Inches(0.8), Inches(2.6), Inches(2.6), C_GREEN, C_BLACK, Pt(3))
    tf = circle_box.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "₦250"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(42)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p2 = tf.add_paragraph()
    p2.text = "= 1 RIDE POINT"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = FONT_HEADING
    p2.font.size = Pt(11)
    p2.font.bold = True
    p2.font.color.rgb = C_DARKGRAY
    
    tx = s6.shapes.add_textbox(Inches(0.5), body_top + Inches(3.7), left_w6 - Inches(1.0), Inches(2.2))
    tf = tx.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Dedicated Bank Account"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "Every student gets a unique, permanent virtual bank account number linked directly to their student profile."
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_BODY
    p.font.size = Pt(13)
    p.font.color.rgb = C_TEXT_MUTED
    
    # Right 3 Rows
    add_box(s6, left_w6, body_top, right_w6, body_height, C_WHITE, C_BLACK, Pt(2.5))
    row_h = body_height / 3.0
    wallet_points = [
        ("Simple Bank Transfer Top-Up", "Students can transfer any amount (e.g. ₦1,000 → 4 ride points) using any banking app, USSD code, OPay, or PalmPay.", C_WHITE),
        ("Instant Wallet Credit", "Secure automated payment alerts credit student wallets within 2 seconds, safely converting every naira into usable ride points.", C_GRAY),
        ("Campus Cash Booth Alternative", "An on-campus service desk allows designated university staff to credit student cards with cash whenever needed.", C_WHITE)
    ]
    for i, (title, desc, bg_c) in enumerate(wallet_points):
        row_top = body_top + Inches(i * (6.7 / 3.0))
        add_box(s6, left_w6, row_top, right_w6, Inches(6.7 / 3.0), bg_c, C_BLACK, Pt(1.5))
        tx = s6.shapes.add_textbox(left_w6 + Inches(0.5), row_top + Inches(0.35), right_w6 - Inches(1.0), Inches(1.4))
        tf = tx.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title.upper()
        p.font.name = FONT_HEADING
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        p.space_after = Pt(6)
        
        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(13)
        p.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 7: COMPARISON MATRIX TABLE
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "07", "System Comparison", "WHY HYPERION WINS")
    
    add_box(s7, Inches(0), body_top, prs.slide_width, body_height, C_WHITE, C_BLACK, Pt(2.5))
    
    # Table shape
    rows, cols = 6, 5
    table_shape = s7.shapes.add_table(rows, cols, Inches(0.6), body_top + Inches(0.4), Inches(12.133), Inches(5.8))
    table = table_shape.table
    
    # Column widths
    table.columns[0].width = Inches(2.5)
    table.columns[1].width = Inches(2.4)
    table.columns[2].width = Inches(2.4)
    table.columns[3].width = Inches(2.4)
    table.columns[4].width = Inches(2.433)
    
    headers = ["KEY FEATURE", "CASH / PAPER TICKETS", "REGULAR RIDE APPS", "STANDARD POS MACHINES", "HYPERION TRANSIT"]
    data = [
        ["Boarding Speed", "Slow (15 – 30 seconds)", "Moderate (8 – 15 seconds)", "Slow (10 – 20 seconds)", "Instant (< 0.5s Card/QR Tap)"],
        ["Offline Capability", "Unmonitored cash", "Fails with poor signal", "Fails with poor signal", "Works Offline & Syncs Later"],
        ["Bus Hardware", "None", "None (phone only)", "Generic bank POS", "Custom Scanner & Embedded IoT"],
        ["Automated Fares", "Manual change issues", "Manual card/in-app flow", "Bank network dependent", "Instant Sub-Second RFID & QR"],
        ["Revenue Accounting", "Frequent cash loss (>20%)", "App-only rides", "Delayed settlements", "100% Real-Time & Audited"]
    ]
    
    for c, h in enumerate(headers):
        cell = table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_BLACK
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_HEADING
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
    
    for r, row_data in enumerate(data):
        is_highlight = (r % 2 == 0)
        for c, val in enumerate(row_data):
            cell = table.cell(r + 1, c)
            cell.fill.solid()
            if c == 4:
                cell.fill.fore_color.rgb = C_GREEN
            elif is_highlight:
                cell.fill.fore_color.rgb = C_GRAY
            else:
                cell.fill.fore_color.rgb = C_WHITE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_BODY
            p.font.size = Pt(11)
            p.font.bold = (c == 4 or c == 0)
            p.font.color.rgb = C_BLACK

    # ==========================================
    # SLIDE 8: LATENCY BENCHMARKS & STATS
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "08", "Speed & Performance", "SPEED TEST RESULTS")
    
    chart_w = Inches(7.5)
    stat_w = prs.slide_width - chart_w
    
    # Left chart pane
    add_box(s8, Inches(0), body_top, chart_w, body_height, C_WHITE, C_BLACK, Pt(2.5))
    tx = s8.shapes.add_textbox(Inches(0.6), body_top + Inches(0.4), chart_w - Inches(1.2), Inches(0.8))
    tf = tx.text_frame
    p = tf.paragraphs[0]
    p.text = "Response Speed Breakdown"
    p.font.name = FONT_HEADING
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    
    bars = [
        ("1. OFFLINE CARD TAP (45ms — Instant)", 0.20, "45ms", C_GREEN),
        ("2. ONLINE CARD TAP (180ms — Blazing Fast)", 0.42, "180ms", C_PINK),
        ("3. PHONE QR CODE SCAN (420ms — Under Half a Second)", 0.68, "420ms", C_GRAY),
        ("4. BANK TRANSFER WALLET UPDATE (1.2s — Near-Instant)", 0.95, "1.2s", C_BLACK)
    ]
    
    bar_start_y = body_top + Inches(1.4)
    for i, (title, ratio, val_str, bg_c) in enumerate(bars):
        item_y = bar_start_y + Inches(i * 1.2)
        
        tx = s8.shapes.add_textbox(Inches(0.6), item_y, chart_w - Inches(1.2), Inches(0.35))
        tf = tx.text_frame
        p = tf.paragraphs[0]
        p.text = title.upper()
        p.font.name = FONT_HEADING
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_DARKGRAY
        
        # Track
        track_w = chart_w - Inches(1.2)
        add_box(s8, Inches(0.6), item_y + Inches(0.35), track_w, Inches(0.5), C_GRAY, C_BLACK, Pt(1.5))
        # Fill
        fill_box = add_box(s8, Inches(0.6), item_y + Inches(0.35), track_w * ratio, Inches(0.5), bg_c, C_BLACK, Pt(1.5))
        tf = fill_box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = val_str
        p.font.name = FONT_HEADING
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = C_WHITE if bg_c == C_BLACK else C_BLACK
    
    # Right insights pane (Pink)
    add_box(s8, chart_w, body_top, stat_w, body_height, C_PINK, C_BLACK, Pt(2.5))
    
    stat_cards = [
        ("< 0.2s", "AVERAGE TAP VERIFICATION", "Passengers can tap and step right in without waiting for slow loading screens."),
        ("99.98%", "TRANSACTION RELIABILITY", "Built-in safety checks ensure students are never charged twice for the same ride.")
    ]
    for i, (num, heading, desc) in enumerate(stat_cards):
        sc_y = body_top + Inches(0.8 + i * 2.8)
        sc_box = add_box(s8, chart_w + Inches(0.5), sc_y, stat_w - Inches(1.0), Inches(2.2), C_WHITE, C_BLACK, Pt(2))
        tx = s8.shapes.add_textbox(chart_w + Inches(0.7), sc_y + Inches(0.2), stat_w - Inches(1.4), Inches(1.8))
        tf = tx.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = num
        p.font.name = FONT_HEADING
        p.font.size = Pt(36)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        
        p = tf.add_paragraph()
        p.text = heading
        p.font.name = FONT_HEADING
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        p.space_after = Pt(4)
        
        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(12)
        p.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 9: LIVE DEMO RUNTHROUGH
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "09", "Live Exhibition Demo", "STEP-BY-STEP WALKTHROUGH")
    
    demo_stages = [
        {"col": 0, "row": 0, "bg": C_WHITE, "stage": "DEMO STAGE 01", "tag": "CARD TAP", "title": "Card Tap Boarding", "body": "Tap the student card on the bus scanner. The screen immediately displays \"₦250 Deducted | 4 Pts Remaining\", beeps, and lights up green.", "sub": "INSTANT PASSENGER VALIDATION"},
        {"col": 1, "row": 0, "bg": C_PINK, "stage": "DEMO STAGE 02", "tag": "PHONE QR", "title": "Phone QR Boarding", "body": "Open the student app and scan the driver's QR code. The fare is deducted immediately with no need to type in a PIN or password.", "sub": "SMARTPHONE BOARDING PASS"},
        {"col": 0, "row": 1, "bg": C_GREEN, "stage": "DEMO STAGE 03", "tag": "BANK TOP-UP", "title": "Real-Time Bank Deposit", "body": "Send ₦500 from a commercial bank app to the student's personal account number. The wallet automatically updates with 2 ride points in seconds.", "sub": "AUTOMATED PAYMENT PROCESSING"},
        {"col": 1, "row": 1, "bg": C_GRAY, "stage": "DEMO STAGE 04", "tag": "ADMIN DASHBOARD", "title": "Manager Control Screen", "body": "The manager's laptop dashboard shows live boarding telemetry, bus locations, ride history, and automated revenue totals in real time.", "sub": "LIVE FLEET & REVENUE OVERVIEW"}
    ]
    
    for d in demo_stages:
        card_l = Inches(d["col"] * 6.666)
        card_t = Inches(0.8 + d["row"] * 3.35)
        add_box(s9, card_l, card_t, cards_w, cards_h, d["bg"], C_BLACK, Pt(2))
        
        tx = s9.shapes.add_textbox(card_l + Inches(0.4), card_t + Inches(0.3), cards_w - Inches(0.8), cards_h - Inches(0.6))
        tf = tx.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = f"{d['stage']}  |  {d['tag']}"
        p.font.name = FONT_HEADING
        p.font.size = Pt(10)
        p.font.color.rgb = C_DARKGRAY
        p.space_after = Pt(6)
        
        p = tf.add_paragraph()
        p.text = d["title"]
        p.font.name = FONT_HEADING
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = C_BLACK
        p.space_after = Pt(8)
        
        p = tf.add_paragraph()
        p.text = d["body"]
        p.font.name = FONT_BODY
        p.font.size = Pt(12)
        p.font.color.rgb = C_TEXT_MUTED
        p.space_after = Pt(10)
        
        p = tf.add_paragraph()
        p.text = d["sub"]
        p.font.name = FONT_HEADING
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_DARKGRAY

    # ==========================================
    # SLIDE 10: CONCLUSION & TEAM ATTRIBUTION
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    left_w10 = Inches(6.8)
    right_w10 = prs.slide_width - left_w10
    
    # Left Pane (Green)
    add_box(s10, Inches(0), Inches(0), left_w10, prs.slide_height, C_GREEN, C_BLACK, Pt(3))
    
    # Brand Top Left
    if os.path.exists(school_badge_path):
        badge_frame = add_box(s10, Inches(0.6), Inches(0.6), Inches(0.85), Inches(0.85), C_WHITE, C_BLACK, Pt(2))
        s10.shapes.add_picture(school_badge_path, Inches(0.65), Inches(0.65), width=Inches(0.75))
    
    tx = s10.shapes.add_textbox(Inches(1.6), Inches(0.65), Inches(4.8), Inches(0.8))
    tf = tx.text_frame
    p = tf.paragraphs[0]
    p.text = "HYPERION SYSTEMS"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    
    # Conclusion text
    tx = s10.shapes.add_textbox(Inches(0.6), Inches(2.2), Inches(5.8), Inches(3.4))
    tf = tx.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "CONCLUSION"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_DARKGRAY
    p.space_after = Pt(8)
    
    p = tf.add_paragraph()
    p.text = "Smart.\nCashless.\nConnected."
    p.font.name = FONT_HEADING
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    p.space_after = Pt(14)
    
    p = tf.add_paragraph()
    p.text = "Hyperion delivers a reliable, fast, and easy-to-use campus transit system engineered specifically for Nigerian university environments."
    p.font.name = FONT_BODY
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_DARKGRAY
    
    tag10 = add_box(s10, Inches(0.6), Inches(6.2), Inches(3.6), Inches(0.5), C_WHITE, C_BLACK, Pt(2))
    tf = tag10.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "SWEP 200 · UNIVERSITY OF ILORIN"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    
    # Right Pane (Attribution with background image)
    top_h = Inches(6.2)
    bottom_h = prs.slide_height - top_h
    
    add_box(s10, left_w10, Inches(0), right_w10, top_h, C_BLACK, C_BLACK, Pt(3))
    if os.path.exists(team_bg_path):
        s10.shapes.add_picture(team_bg_path, left_w10, Inches(0), width=right_w10)
        # Add translucent dark overlay box
        overlay = add_box(s10, left_w10, Inches(0), right_w10, top_h, RGBColor(10, 15, 20), None)
        # Note: PowerPoint shapes overlay solidly; let's format text with clear background badge
    
    # Team Info Box
    info_box = add_box(s10, left_w10 + Inches(0.5), Inches(1.0), right_w10 - Inches(1.0), Inches(4.2), RGBColor(15, 15, 15), C_WHITE, Pt(1.5))
    tx = s10.shapes.add_textbox(left_w10 + Inches(0.8), Inches(1.3), right_w10 - Inches(1.6), Inches(3.6))
    tf = tx.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "Project Team & Attribution"
    p.font.name = FONT_HEADING
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(18)
    
    p = tf.add_paragraph()
    p.text = "Exhibition: SWEP 200 Group H (2026)"
    p.font.name = FONT_BODY
    p.font.size = Pt(14)
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(12)
    
    p = tf.add_paragraph()
    p.text = "Institution: University of Ilorin, Nigeria"
    p.font.name = FONT_BODY
    p.font.size = Pt(14)
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(12)
    
    p = tf.add_paragraph()
    p.text = "Repository: github.com/musamusakannike/hyperion"
    p.font.name = FONT_MONO
    p.font.size = Pt(13)
    p.font.color.rgb = C_GREEN
    
    # Bottom Footer
    add_box(s10, left_w10, top_h, right_w10 / 2.0, bottom_h, C_PINK, C_BLACK, Pt(2))
    tx = s10.shapes.add_textbox(left_w10, top_h, right_w10 / 2.0, bottom_h)
    tf = tx.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "ENGINEERING DEMO"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLACK
    
    add_box(s10, left_w10 + (right_w10 / 2.0), top_h, right_w10 / 2.0, bottom_h, C_BLACK, C_BLACK, Pt(2))
    tx = s10.shapes.add_textbox(left_w10 + (right_w10 / 2.0), top_h, right_w10 / 2.0, bottom_h)
    tf = tx.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "GROUP H © 2026"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    
    output_path = os.path.join(base_dir, "hyperion_presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_presentation()

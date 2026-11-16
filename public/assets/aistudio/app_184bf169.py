from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import json
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = 'nagmm_butchery_secret_key_pos_2026'
DB_NAME = "restaurant.db"

POINTS_EARN_RATE = 0.10
POINT_VALUE_EGP = 0.10
POINTS_EXPIRY_DAYS = 90

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE, password TEXT, role TEXT, full_name TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE, name TEXT, password TEXT,
            total_spent REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS loyalty_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER, order_id INTEGER, points_earned INTEGER,
            points_used INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS promotions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT, description TEXT, image_url TEXT,
            discount_pct REAL DEFAULT 0.0, is_active INTEGER DEFAULT 1
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE, unit TEXT, cost_per_unit REAL, stock_qty REAL, min_limit REAL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE, price REAL, department TEXT, is_available INTEGER DEFAULT 1
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER, material_id INTEGER, required_qty REAL,
            FOREIGN KEY (product_id) REFERENCES items (id),
            FOREIGN KEY (material_id) REFERENCES materials (id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS captains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE, phone TEXT, monthly_target REAL DEFAULT 0.0,
            base_commission_rate REAL DEFAULT 0.0, accelerator_rate REAL DEFAULT 0.0, is_active INTEGER DEFAULT 1
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE, phone TEXT, is_active INTEGER DEFAULT 1
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_type TEXT, table_num INTEGER, captain_id INTEGER, captain_name TEXT,
            driver_name TEXT, order_status TEXT DEFAULT 'pending', total_amount REAL,
            discount_amount REAL DEFAULT 0.0, customer_id INTEGER DEFAULT NULL,
            items_json TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (captain_id) REFERENCES captains (id),
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')

    # التأكد من صحة عمود is_available في جدول items
    try:
        cursor.execute("ALTER TABLE items ADD COLUMN is_available INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        pass
    cursor.execute("UPDATE items SET is_available = 1 WHERE is_available IS NULL")

    # حسابات المستخدمين
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        default_users = [
            ("admin", "1234", "admin", "إسلام نجم"),
            ("cashier", "1234", "cashier", "الكاشير الرئيسية"),
            ("captain1", "1234", "captain", "كابتن أحمد"),
            ("driver1", "1234", "driver", "محمود طيار")
        ]
        cursor.executemany("INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)", default_users)

    # إعادة زرع المنيو إذا كان الجدول فارغاً
    cursor.execute("SELECT COUNT(*) FROM items")
    if cursor.fetchone()[0] == 0:
        menu_data = [
            ("ثمن كبدة جريل", 130.0, "الجريل"), ("ربع كبدة جريل", 260.0, "الجريل"),
            ("تلت كبدة جريل", 390.0, "الجريل"), ("نص كبدة جريل", 520.0, "الجريل"),
            ("كيلو كبدة جريل", 1040.0, "الجريل"), ("ثمن سجق جريل", 100.0, "الجريل"),
            ("ربع سجق جريل", 200.0, "الجريل"), ("تلت سجق جريل", 300.0, "الجريل"),
            ("نص سجق جريل", 400.0, "الجريل"), ("كيلو سجق جريل", 800.0, "الجريل"),
            ("طاجن عكاوي بالبصل", 390.0, "الطواجن"), ("طاجن فريك باللحمة", 230.0, "الطواجن"),
            ("طاجن كوارع كامل", 250.0, "الطواجن"), ("طاجن المعلم (كوارع ورق عنب)", 250.0, "الطواجن"),
            ("مكرونة سادة جريل", 35.0, "المكرونة"), ("مكرونة بالكبدة والكلاوي جريل", 130.0, "المكرونة"),
            ("أرز سادة بالشعرية", 35.0, "الأرز"), ("أرز كبدة وكلاوي", 140.0, "الأرز"),
            ("فتة سادة", 80.0, "الفتة"), ("فتة باللحمة", 220.0, "الفتة"),
            ("كيلو كباب ضاني", 1350.0, "المشويات"), ("كيلو كفتة", 800.0, "المشويات"),
            ("حواوشي سادة", 90.0, "الحواوشي"), ("حواوشي بالسجق", 90.0, "الحواوشي"),
            ("سلطة خضراء", 20.0, "السلاطات والمقبلات"), ("سلطة طحينة", 20.0, "السلاطات والمقبلات")
        ]
        cursor.executemany("INSERT OR IGNORE INTO items (name, price, department, is_available) VALUES (?, ?, ?, 1)", menu_data)

    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def clean_expired_points(customer_id):
    conn = get_db()
    cursor = conn.cursor()
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        UPDATE loyalty_points 
        SET status = 'expired' 
        WHERE customer_id = ? AND status = 'active' AND expires_at < ?
    ''', (customer_id, now_str))
    conn.commit()
    conn.close()

def get_customer_active_points(customer_id):
    clean_expired_points(customer_id)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT SUM(points_earned - points_used) as active_points 
        FROM loyalty_points 
        WHERE customer_id = ? AND status = 'active'
    ''', (customer_id,))
    row = cursor.fetchone()
    conn.close()
    return row['active_points'] if row and row['active_points'] else 0

init_db()

def login_required(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('login_page'))
            if roles and session.get('role') not in roles:
                return "عفواً! ليس لديك صلاحية الوصول.", 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/login')
def login_page(): return render_template('login.html')

@app.route('/logout')
def logout(): session.clear(); return redirect(url_for('login_page'))

@app.route('/')
@login_required(roles=['admin'])
def admin_dashboard(): return render_template('index.html')

@app.route('/cashier')
@login_required(roles=['admin', 'cashier'])
def cashier_page(): return render_template('cashier.html')

@app.route('/captain')
@login_required(roles=['admin', 'captain'])
def captain_page(): return render_template('captain.html')

@app.route('/driver')
@login_required(roles=['admin', 'driver'])
def driver_page(): return render_template('driver.html')

@app.route('/order')
def customer_page(): return render_template('customer.html')

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username, password = data.get('username'), data.get('password')
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone(); conn.close()
    if user:
        session['user_id'], session['username'], session['role'], session['full_name'] = user['id'], user['username'], user['role'], user['full_name']
        redirect_map = {'admin': '/', 'cashier': '/cashier', 'captain': '/captain', 'driver': '/driver'}
        return jsonify({'status': 'success', 'redirect': redirect_map.get(user['role'], '/login')})
    return jsonify({'status': 'error', 'message': 'بيانات الدخول غير صحيحة!'}), 401

@app.route('/api/current-user')
def current_user():
    if 'user_id' in session:
        return jsonify({'logged_in': True, 'username': session.get('username'), 'role': session.get('role'), 'full_name': session.get('full_name')})
    return jsonify({'logged_in': False})

@app.route('/api/customer/auth', methods=['POST'])
def customer_auth():
    data = request.json or {}
    phone = data.get('phone', '').strip()
    name = data.get('name', '').strip()
    if not phone: return jsonify({'status': 'error', 'message': 'رقم الموبايل مطلوب'}), 400
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE phone = ?", (phone,))
    cust = cursor.fetchone()
    if not cust:
        cursor.execute("INSERT INTO customers (phone, name) VALUES (?, ?)", (phone, name or 'عميل نجم'))
        conn.commit()
        cursor.execute("SELECT * FROM customers WHERE phone = ?", (phone,))
        cust = cursor.fetchone()
    conn.close()
    active_points = get_customer_active_points(cust['id'])
    return jsonify({'status': 'success', 'customer': {'id': cust['id'], 'name': cust['name'], 'phone': cust['phone'], 'active_points': active_points, 'points_value_egp': round(active_points * POINT_VALUE_EGP, 2)}})

@app.route('/api/promotions', methods=['GET', 'POST'])
def handle_promotions():
    conn = get_db(); cursor = conn.cursor()
    if request.method == 'POST':
        data = request.json or {}
        cursor.execute('INSERT INTO promotions (title, description, image_url, discount_pct) VALUES (?, ?, ?, ?)', (data.get('title'), data.get('description'), data.get('image_url'), float(data.get('discount_pct', 0))))
        conn.commit(); conn.close()
        return jsonify({'status': 'success', 'message': 'تم إضافة العرض بنجاح'})
    else:
        cursor.execute("SELECT * FROM promotions WHERE is_active = 1")
        promos = [dict(row) for row in cursor.fetchall()]; conn.close()
        return jsonify(promos)

@app.route('/api/items', methods=['GET'])
def get_items():
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('SELECT * FROM items ORDER BY department, id')
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(items)

@app.route('/api/submit-order', methods=['POST'])
def submit_order():
    try:
        data = request.json or {}
        items = data.get('items', [])
        table_num = int(data.get('table_num', 0))
        order_type = data.get('order_type', 'delivery')
        captain_id = data.get('captain_id')
        captain_name = data.get('captain_name', 'عميل أونلاين')
        customer_id = data.get('customer_id')
        use_points = data.get('use_points', False)
        
        conn = get_db(); cursor = conn.cursor()
        total = sum(float(i['price']) * int(i['qty']) for i in items)
        discount = 0.0

        if customer_id and use_points:
            active_pts = get_customer_active_points(customer_id)
            pts_value = active_pts * POINT_VALUE_EGP
            if pts_value > 0:
                discount = min(total, pts_value)
                total -= discount
                needed_pts = int(discount / POINT_VALUE_EGP)
                cursor.execute("SELECT * FROM loyalty_points WHERE customer_id = ? AND status = 'active' AND (points_earned - points_used) > 0 ORDER BY created_at ASC", (customer_id,))
                for r in cursor.fetchall():
                    avail = r['points_earned'] - r['points_used']
                    if needed_pts <= 0: break
                    deduct = min(avail, needed_pts)
                    needed_pts -= deduct
                    new_used = r['points_used'] + deduct
                    new_status = 'fully_used' if new_used >= r['points_earned'] else 'active'
                    cursor.execute("UPDATE loyalty_points SET points_used = ?, status = ? WHERE id = ?", (new_used, new_status, r['id']))

        items_str = json.dumps(items, ensure_ascii=False)
        cursor.execute('''
            INSERT INTO orders (order_type, table_num, captain_id, captain_name, customer_id, total_amount, discount_amount, items_json, status, order_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
        ''', (order_type, table_num, captain_id, captain_name, customer_id, total, discount, items_str))
        
        order_id = cursor.lastrowid
        conn.commit(); conn.close()
        return jsonify({'status': 'success', 'message': 'تم إرسال الطلب بنجاح', 'order_id': order_id})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/pay-order', methods=['POST'])
def pay_order():
    try:
        data = request.json or {}; order_id = data.get('order_id')
        conn = get_db(); cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        ord_row = cursor.fetchone()
        if ord_row and ord_row['status'] != 'paid':
            cursor.execute("UPDATE orders SET status = 'paid', order_status = 'delivered' WHERE id = ?", (order_id,))
            if ord_row['customer_id']:
                c_id = ord_row['customer_id']
                pts_earned = int(float(ord_row['total_amount']) * POINTS_EARN_RATE)
                expiry_date = (datetime.now() + timedelta(days=POINTS_EXPIRY_DAYS)).strftime('%Y-%m-%d %H:%M:%S')
                if pts_earned > 0:
                    cursor.execute("INSERT INTO loyalty_points (customer_id, order_id, points_earned, expires_at) VALUES (?, ?, ?, ?)", (c_id, order_id, pts_earned, expiry_date))
                    cursor.execute("UPDATE customers SET total_spent = total_spent + ? WHERE id = ?", (ord_row['total_amount'], c_id))
        conn.commit(); conn.close()
        return jsonify({'status': 'success', 'message': 'تم التقفيل وإضافة النقاط'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/drivers', methods=['GET', 'POST'])
def handle_drivers():
    conn = get_db(); cursor = conn.cursor()
    if request.method == 'POST':
        data = request.json or {}
        cursor.execute("INSERT INTO drivers (name, phone) VALUES (?, ?)", (data.get('name'), data.get('phone', '')))
        cursor.execute("INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, '1234', 'driver', ?)", (data.get('name'), data.get('name')))
        conn.commit(); conn.close()
        return jsonify({'status': 'success', 'message': 'تم حفظ الطيار'})
    else:
        cursor.execute("SELECT * FROM drivers WHERE is_active = 1")
        drivers = [dict(row) for row in cursor.fetchall()]; conn.close()
        return jsonify(drivers)

@app.route('/api/captains', methods=['GET', 'POST'])
def handle_captains():
    conn = get_db(); cursor = conn.cursor()
    if request.method == 'POST':
        data = request.json or {}
        cursor.execute('INSERT INTO captains (name, phone, monthly_target, base_commission_rate, accelerator_rate) VALUES (?, ?, ?, ?, ?)',
                       (data.get('name'), data.get('phone', ''), float(data.get('monthly_target', 0)), float(data.get('base_commission_rate', 0)), float(data.get('accelerator_rate', 0))))
        cursor.execute("INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, '1234', 'captain', ?)", (data.get('name'), data.get('name')))
        conn.commit(); conn.close()
        return jsonify({'status': 'success', 'message': 'تم الحفظ'})
    else:
        cursor.execute('SELECT * FROM captains WHERE is_active = 1')
        captains = [dict(row) for row in cursor.fetchall()]; conn.close()
        return jsonify(captains)

@app.route('/api/kpi-report')
def get_kpi_report():
    conn = get_db(); cursor = conn.cursor()
    cursor.execute('SELECT * FROM captains WHERE is_active = 1')
    captains = [dict(row) for row in cursor.fetchall()]
    report = []
    for cap in captains:
        cursor.execute("SELECT SUM(total_amount) as total_sales, COUNT(id) as total_orders FROM orders WHERE captain_id = ? AND status = 'paid'", (cap['id'],))
        row = cursor.fetchone()
        sales = row['total_sales'] or 0.0
        target, base_rate, acc_rate = cap['monthly_target'], cap['base_commission_rate'], cap['accelerator_rate']
        comm = (target * (base_rate/100.0)) + ((sales - target) * (acc_rate/100.0)) if (target > 0 and sales > target) else sales * (base_rate/100.0)
        report.append({'captain_name': cap['name'], 'monthly_target': target, 'total_sales': sales, 'calculated_commission': round(comm, 2), 'achievement_pct': round((sales/target*100) if target>0 else 0, 1)})
    conn.close()
    return jsonify(report)

@app.route('/api/materials', methods=['GET', 'POST'])
def handle_materials():
    conn = get_db(); cursor = conn.cursor()
    if request.method == 'POST':
        data = request.json
        cursor.execute('INSERT OR REPLACE INTO materials (name, unit, cost_per_unit, stock_qty, min_limit) VALUES (?, ?, ?, ?, ?)', (data['name'], data['unit'], float(data['cost_per_unit']), float(data['stock_qty']), float(data['min_limit'])))
        conn.commit(); conn.close()
        return jsonify({'status': 'success', 'message': 'تم حفظ الخامة'})
    else:
        cursor.execute('SELECT * FROM materials')
        materials = [dict(row) for row in cursor.fetchall()]; conn.close()
        return jsonify(materials)

@app.route('/api/bom/save', methods=['POST'])
def save_product_bom():
    data = request.json; conn = get_db(); cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO items (name, price, department, is_available) VALUES (?, ?, ?, 1)", (data['item_name'], float(data['price']), data['department']))
    conn.commit(); conn.close()
    return jsonify({'status': 'success', 'message': 'تم الحفظ'})

@app.route('/api/active-tables')
def active_tables():
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("SELECT table_num, captain_name, captain_id FROM orders WHERE status = 'pending' AND order_type = 'hall'")
    rows = cursor.fetchall()
    tables_info = {r['table_num']: {'captain_name': r['captain_name']} for r in rows}
    conn.close()
    return jsonify({'busy_tables': tables_info})

@app.route('/api/orders')
def get_orders():
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE status = 'pending' ORDER BY id DESC")
    rows = cursor.fetchall()
    orders = []
    for row in rows:
        d = dict(row)
        try: d['items'] = json.loads(d.get('items_json') or '[]')
        except: d['items'] = []
        orders.append(d)
    conn.close()
    return jsonify(orders)

@app.route('/api/orders/update-status', methods=['POST'])
def update_order_status():
    data = request.json or {}; conn = get_db(); cursor = conn.cursor()
    if data.get('driver_name'):
        cursor.execute("UPDATE orders SET order_status = ?, driver_name = ? WHERE id = ?", (data.get('order_status'), data.get('driver_name'), data.get('order_id')))
    else:
        cursor.execute("UPDATE orders SET order_status = ? WHERE id = ?", (data.get('order_status'), data.get('order_id')))
    conn.commit(); conn.close()
    return jsonify({'status': 'success', 'message': 'تم التحديث'})

@app.route('/api/shift-summary')
def shift_summary():
    conn = get_db(); cursor = conn.cursor()
    cursor.execute("SELECT SUM(total_amount) as total_sales, COUNT(id) as paid_count FROM orders WHERE status = 'paid'")
    row = cursor.fetchone(); conn.close()
    return jsonify({'total_sales': row['total_sales'] or 0.0, 'paid_count': row['paid_count'] or 0})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
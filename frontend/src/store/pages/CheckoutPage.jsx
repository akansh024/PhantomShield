import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, Truck, MapPin, Tag } from 'lucide-react';
import { storeApi } from '../../api/storeApi';
import { useStore } from '../../context/StoreContext';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-400 mb-1.5 font-medium">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Input({ id, error, ...props }) {
  return (
    <input
      id={id}
      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none transition
        ${error ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-violet-500'}`}
      {...props}
    />
  );
}

export default function CheckoutPage() {
  const { cart, refreshCart, notify } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pin: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim() || form.full_name.length < 2) e.full_name = 'Enter your full name';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.line1.trim() || form.line1.length < 5) e.line1 = 'Enter a complete address';
    if (!form.city.trim()) e.city = 'Enter your city';
    if (!form.state) e.state = 'Select your state';
    if (!/^\d{6}$/.test(form.pin)) e.pin = 'Enter a valid 6-digit PIN code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.items.length === 0) {
      notify('error', 'Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      const order = await storeApi.placeOrder({
        shipping_address: form,
        delivery_note: '',
        promo_code: promoCode.trim(),
      });
      // Refresh cart state so navbar badge resets to 0
      await refreshCart();
      navigate(`/shop/order-success/${order.order_id}`, { state: { order } });
    } catch (err) {
      notify('error', err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#080912] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
          <Link to="/shop/products" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium">Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/shop/cart" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <MapPin className="w-6 h-6 text-violet-400" />
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Shipping form */}
          <div className="space-y-5">
            <div className="bg-[#111120] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-violet-400" />
                Shipping Address
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *" id="full_name" error={errors.full_name}>
                  <Input id="full_name" placeholder="Rahul Sharma" value={form.full_name} onChange={e => set('full_name', e.target.value)} error={errors.full_name} />
                </Field>
                <Field label="Phone Number *" id="phone" error={errors.phone}>
                  <Input id="phone" placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} error={errors.phone} />
                </Field>
              </div>

              <div className="mt-4 space-y-4">
                <Field label="Address Line 1 *" id="line1" error={errors.line1}>
                  <Input id="line1" placeholder="Building, Street, Area" value={form.line1} onChange={e => set('line1', e.target.value)} error={errors.line1} />
                </Field>
                <Field label="Address Line 2 (optional)" id="line2">
                  <Input id="line2" placeholder="Landmark, Apartment number" value={form.line2} onChange={e => set('line2', e.target.value)} />
                </Field>

                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City *" id="city" error={errors.city}>
                    <Input id="city" placeholder="Bengaluru" value={form.city} onChange={e => set('city', e.target.value)} error={errors.city} />
                  </Field>
                  <Field label="State *" id="state" error={errors.state}>
                    <select
                      id="state"
                      value={form.state}
                      onChange={e => set('state', e.target.value)}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition
                        ${errors.state ? 'border-red-500/50' : 'border-white/10 focus:border-violet-500'}`}
                    >
                      <option value="" className="bg-[#111120]">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s} className="bg-[#111120]">{s}</option>)}
                    </select>
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                  </Field>
                  <Field label="PIN Code *" id="pin" error={errors.pin}>
                    <Input id="pin" placeholder="560034" maxLength={6} value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} error={errors.pin} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Promo code */}
            <div className="bg-[#111120] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                Promo Code
              </h2>
              <div className="flex gap-3">
                <input
                  placeholder="WELCOME10, SAVE15, FLAT100, FLAT200"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition font-mono"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Discount is applied automatically at checkout.</p>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div>
            <div className="bg-[#111120] border border-white/5 rounded-2xl p-6 sticky top-20">
              <h2 className="text-white font-semibold mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.cart_item_id} className="flex items-center gap-3">
                    <img src={item.thumbnail} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-white/5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-medium line-clamp-1">{item.name}</p>
                      <p className="text-gray-500 text-xs">Qty: {item.quantity} × {fmt(item.price)}</p>
                    </div>
                    <span className="text-white text-xs font-semibold shrink-0">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span><span>{fmt(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery</span>
                  <span>{cart.delivery_fee > 0 ? fmt(cart.delivery_fee) : <span className="text-emerald-400">FREE</span>}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-3">
                  <span>Total</span><span>{fmt(cart.total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Placing Order…
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                No payment required · Simulated checkout
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

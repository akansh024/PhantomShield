import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    document.title = `Order Confirmed – NovaBuy`;
    window.scrollTo({ top: 0 });
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#080912] pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Order details not available.</p>
          <Link to="/shop/orders" className="text-violet-400 hover:underline">View Order History</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-400">Thank you for shopping at NovaBuy</p>
          <div className="inline-block bg-white/5 border border-white/10 rounded-xl px-5 py-2 mt-4">
            <p className="text-sm text-gray-400">Order ID</p>
            <p className="text-white font-mono font-bold">{order.order_id}</p>
          </div>
        </div>

        {/* Delivery info */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#111120] border border-white/5 rounded-2xl p-5 flex items-start gap-3">
            <Truck className="w-5 h-5 text-violet-400 mt-0.5" />
            <div>
              <p className="text-gray-500 text-xs mb-1">Estimated Delivery</p>
              <p className="text-white font-semibold">{order.estimated_delivery}</p>
              <p className="text-gray-600 text-xs mt-0.5">4 business days</p>
            </div>
          </div>
          <div className="bg-[#111120] border border-white/5 rounded-2xl p-5 flex items-start gap-3">
            <Package className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-gray-500 text-xs mb-1">Order Status</p>
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                {order.status}
              </span>
              <p className="text-gray-600 text-xs mt-1">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[#111120] border border-white/5 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.thumbnail} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-white/5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                  <p className="text-gray-500 text-xs">Qty: {item.quantity} × {fmt(item.unit_price)}</p>
                </div>
                <span className="text-white font-semibold text-sm shrink-0">{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 mt-5 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>–{fmt(order.discount)}</span></div>}
            <div className="flex justify-between text-gray-400"><span>Delivery</span><span>{order.delivery_fee > 0 ? fmt(order.delivery_fee) : <span className="text-emerald-400">FREE</span>}</span></div>
            <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10"><span>Total Paid</span><span>{fmt(order.total)}</span></div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-[#111120] border border-white/5 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-400" />
            Delivery Address
          </h2>
          <div className="text-gray-400 text-sm space-y-1">
            <p className="text-white font-medium">{order.shipping_address.full_name}</p>
            <p>{order.shipping_address.line1}</p>
            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
            <p>{order.shipping_address.city}, {order.shipping_address.state} – {order.shipping_address.pin}</p>
            <p className="text-gray-500">📱 {order.shipping_address.phone}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/shop/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-xl transition"
          >
            <Package className="w-4 h-4" /> View Orders
          </Link>
          <Link
            to="/shop/products"
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

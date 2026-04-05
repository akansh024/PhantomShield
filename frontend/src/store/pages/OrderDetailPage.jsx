import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, MapPin, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { storeApi } from '../../api/storeApi';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS = {
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  delivered: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_ICONS = {
  confirmed: CheckCircle,
  processing: Clock,
  shipped: Truck,
  delivered: Package,
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    document.title = `Order ${orderId} – NovaBuy`;
    if (!order) {
      storeApi.getOrder(orderId)
        .then(setOrder)
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [orderId, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080912] pt-24 px-4">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-6 bg-white/3 rounded-lg w-1/4" />
          <div className="bg-white/3 rounded-2xl h-64" />
          <div className="bg-white/3 rounded-2xl h-40" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#080912] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">Order not found</p>
          <Link to="/shop/orders" className="text-violet-400 hover:underline">← Back to Orders</Link>
        </div>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[order.status] || Package;

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back + header */}
        <Link to="/shop/orders" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> All Orders
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Details</h1>
            <p className="text-gray-500 text-sm mt-1 font-mono">{order.order_id}</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full capitalize border ${STATUS_COLORS[order.status]}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {order.status}
          </span>
        </div>

        {/* Delivery info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#111120] border border-white/5 rounded-2xl p-5 flex items-start gap-3">
            <Truck className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-gray-500 text-xs mb-1">Estimated Delivery</p>
              <p className="text-white font-semibold">{order.estimated_delivery}</p>
            </div>
          </div>
          <div className="bg-[#111120] border border-white/5 rounded-2xl p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-gray-500 text-xs mb-1">Placed On</p>
              <p className="text-white font-semibold">
                {new Date(order.placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[#111120] border border-white/5 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
            Items ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <Link key={i} to={`/shop/products/${item.product_id}`} className="flex items-center gap-3 hover:bg-white/3 -mx-2 px-2 py-1 rounded-xl transition">
                <img src={item.thumbnail} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-white/5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-1 hover:text-violet-300 transition">{item.name}</p>
                  <p className="text-gray-500 text-xs">Qty: {item.quantity} × {fmt(item.unit_price)}</p>
                </div>
                <span className="text-white font-semibold text-sm shrink-0">{fmt(item.subtotal)}</span>
              </Link>
            ))}
          </div>

          {/* Pricing */}
          <div className="border-t border-white/10 mt-5 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>–{fmt(order.discount)}</span></div>}
            <div className="flex justify-between text-gray-400">
              <span>Delivery</span>
              <span>{order.delivery_fee > 0 ? fmt(order.delivery_fee) : <span className="text-emerald-400">FREE</span>}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-[#111120] border border-white/5 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-violet-400" />
            Shipping Address
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
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" /> All Orders
          </Link>
          <Link
            to="/shop/products"
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

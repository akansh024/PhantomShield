import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ChevronRight, ShoppingBag, MapPin, Truck } from 'lucide-react';
import { storeApi } from '../../api/storeApi';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS = {
  confirmed: 'bg-emerald-500/20 text-emerald-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-violet-500/20 text-violet-400',
  delivered: 'bg-gray-500/20 text-gray-400',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Orders – NovaBuy';
    storeApi.getOrders()
      .then(data => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-6 h-6 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            <p className="text-gray-500 text-sm mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white/3 rounded-2xl h-32 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-16 h-16 text-gray-800 mb-5" />
            <h2 className="text-2xl font-bold text-gray-400 mb-3">No orders yet</h2>
            <p className="text-gray-600 mb-8">Place your first order to see it here</p>
            <Link to="/shop/products" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.order_id} className="bg-[#111120] border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition">
                {/* Order header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order ID</p>
                    <p className="text-white font-mono font-bold">{order.order_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {order.items.slice(0, 3).map((item, i) => (
                    <img key={i} src={item.thumbnail} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-white/5" />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-xs font-bold">
                      +{order.items.length - 3}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 ml-1">
                    <p className="text-white text-sm font-medium line-clamp-1">
                      {order.items[0].name}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Est. {order.estimated_delivery}</span>
                    </div>
                    <span className="text-white font-bold">{fmt(order.total)}</span>
                  </div>
                  <Link
                    to={`/shop/orders/${order.order_id}`}
                    state={{ order }}
                    className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm font-medium transition"
                  >
                    Details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

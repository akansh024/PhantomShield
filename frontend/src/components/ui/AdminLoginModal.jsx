import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X, Terminal, Key, User } from 'lucide-react';
import { adminApi, toApiError } from '../../ops/api/adminApi';

export default function AdminLoginModal({ isOpen, onClose }) {
  const [operatorName, setOperatorName] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await adminApi.login(operatorId, passcode);
      if (response.access_token) {
        localStorage.setItem('admin_clearance', 'verified');
        if (operatorName.trim()) {
          localStorage.setItem('admin_name', operatorName.trim());
        }
        navigate('/dashboard');
        onClose();
      } else {
        setErrorMessage('Authentication failed. Verify operator credentials and retry.');
      }
    } catch (err) {
      setErrorMessage(toApiError(err, 'Unable to reach login API. Please retry.'));
      setPasscode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] backdrop-blur-md bg-[#13141a]/80"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="w-full max-w-sm bg-[#1d1e26] border border-white/10 rounded-xl overflow-hidden shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/5 bg-black/20">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-sm bg-red-500/10 text-red-500">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-lg text-white uppercase tracking-tight">
                    Master Clearance
                  </h3>
                </div>
                <p className="font-['JetBrains_Mono'] text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                  // UNAUTHORIZED ACCESS PROHIBITED
                  <br />
                  // ENTER CREDENTIALS TO PROCEED
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleVerify} className="p-6 flex flex-col gap-5">
                
                {/* Error Banner */}
                <AnimatePresence>
                  {Boolean(errorMessage) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-center rounded-sm"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="group relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ffaa] transition-colors" />
                  <input 
                    type="text" 
                    required
                    placeholder="Operator Name"
                    value={operatorName}
                    onChange={(e) => { setOperatorName(e.target.value); setErrorMessage(''); }}
                    className="w-full bg-black/20 border border-white/5 rounded-md py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa]/50 focus:outline-none transition-all font-['JetBrains_Mono']"
                  />
                </div>

                <div className="group relative">
                  <Terminal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ffaa] transition-colors" />
                  <input 
                    type="text" 
                    required
                    placeholder="Operator ID"
                    value={operatorId}
                    onChange={(e) => { setOperatorId(e.target.value); setErrorMessage(''); }}
                    className="w-full bg-black/20 border border-white/5 rounded-md py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa]/50 focus:outline-none transition-all font-['JetBrains_Mono']"
                  />
                </div>

                <div className="group relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ffaa] transition-colors" />
                  <input 
                    type="password" 
                    required
                    placeholder="Passcode"
                    value={passcode}
                    onChange={(e) => { setPasscode(e.target.value); setErrorMessage(''); }}
                    className="w-full bg-black/20 border border-white/5 rounded-md py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:border-[#00ffaa] focus:ring-1 focus:ring-[#00ffaa]/50 focus:outline-none transition-all font-['JetBrains_Mono']"
                  />
                </div>

                <motion.button
                  whileHover={!loading ? { y: -1, boxShadow: "0 4px 12px rgba(0,255,170,0.2)" } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={loading}
                  className={`mt-2 w-full flex items-center justify-center gap-2 font-['Space_Grotesk'] font-bold text-[13px] tracking-tight uppercase py-3 rounded-md bg-[#00ffaa] text-[#13141a] transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {loading ? 'Authenticating...' : 'Verify Identity'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

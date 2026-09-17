import { useState } from 'react';
import { signInWithGoogle, signInWithGoogleRedirect } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { Anchor, AlertCircle, ShieldCheck, UserCheck, Users, ExternalLink } from 'lucide-react';
import { Role } from '../types';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginAsDemo } = useAuthStore();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Jendela popup SSO ditutup sebelum login selesai. Jika popup tertutup otomatis oleh browser/iframe, silakan gunakan tombol "Buka Tab Baru" atau opsi "Mode Redirect (Full)".');
      } else if (err.code === 'auth/popup-blocked' || err.message?.includes('popup')) {
        setError('Jendela popup diblokir oleh peramban atau iframe. Silakan buka aplikasi di tab baru atau gunakan opsi "Mode Redirect (Full)".');
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setError(`Domain "${currentHost}" belum didaftarkan di Firebase Console. Buka Firebase Console (proyek: gen-lang-client-0385654232) -> Authentication -> Settings -> Authorized domains, lalu tambahkan domain ini.`);
      } else {
        setError(err.message || 'Gagal masuk dengan akun Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memulai autentikasi redirect.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: Role, email: string, name: string) => {
    setError(null);
    loginAsDemo(role, email, name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-teal-50 border border-teal-200 flex items-center justify-center rounded-2xl shadow-xs">
            <Anchor className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            DFW Monev &amp; Project Hub
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Sistem Monitoring &amp; Evaluasi serta Manajemen Proyek Terpadu DFW Indonesia
          </p>
        </div>
        
        {error && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-amber-800 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-xs disabled:opacity-50"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            </span>
            {loading ? 'Menghubungkan Akun...' : 'Masuk dengan Google (Popup)'}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleGoogleRedirectLogin}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Gunakan redirect halaman penuh jika popup browser terblokir"
            >
              Mode Redirect (Full)
            </button>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
              title="Buka di tab peramban terpisah agar popup bebas dari batasan iframe"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Buka Tab Baru
            </a>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider">
              Atau Akses Cepat (Mode Demo / Uji Coba)
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin', 'admin@dfw.or.id', 'Admin DFW (Koordinator Nasional)')}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 transition-colors text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-teal-600 text-white shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-teal-900">
                  Masuk sebagai Admin DFW
                </p>
                <p className="text-[11px] text-gray-500">admin@dfw.or.id (Hak Akses Penuh)</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
              Admin
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('project_coordinator', 'budi.santoso@dfw.or.id', 'Budi Santoso (Project Coordinator)')}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-blue-100 text-blue-700 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-blue-900">
                  Koordinator Proyek
                </p>
                <p className="text-[11px] text-gray-500">budi.santoso@dfw.or.id</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Coordinator
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('field_officer', 'dewi.lestari@dfw.or.id', 'Dewi Lestari (Field Officer)')}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-900">
                  Petugas Lapangan
                </p>
                <p className="text-[11px] text-gray-500">dewi.lestari@dfw.or.id (Muara Baru / Pelabuhan)</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Officer
            </span>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Data tersinkronisasi dengan Firestore &amp; penyimpanan lokal secara otomatis.
        </p>
      </div>
    </div>
  );
}

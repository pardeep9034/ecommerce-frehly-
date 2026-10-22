import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ClipboardList, Home as HomeIcon, LogOut, Search, ShoppingCart, Store, User } from 'lucide-react';
// The navbar no longer uses these classes, but the login pages still rely on its global .btn / .btn-primary.
import '../../styles/navbar.css';
import { logout } from '@/redux/authSlice';
import { getProfile } from '@/apis/authApi';
import { openLocationPicker } from '@/redux/locationSlice';
import { locationLabel } from '@/hooks/use-deliveryLocation';
import { getToken } from '@/lib/tokenStorage';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mobile first. Phones and tablets: a two-row header (delivery location, then search) and a bottom tab bar.
// From lg (1024 px) up: one row with logo, location, search, links, cart and account.

const LocationButton = ({ className = '' }) => {
  const dispatch = useDispatch();
  const location = useSelector((state) => state.location.current);
  const headline = !location
    ? 'Select delivery location'
    : !location.serviceable
      ? 'Not delivering here'
      : location.estimated_delivery_time
        ? `Delivery in ${location.estimated_delivery_time} mins`
        : 'Delivering to';

  return (
    <button
      type="button"
      onClick={() => dispatch(openLocationPicker())}
      aria-label="Change delivery location"
      className={`flex min-w-0 flex-col items-start rounded-lg text-left leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      <span className="w-full truncate text-lg font-black tracking-tight lg:text-base">{headline}</span>
      <span className="flex w-full items-center gap-1 text-xs font-semibold text-primary-foreground/85">
        <span className="truncate">{location ? locationLabel(location) : 'Tap to choose where we deliver'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </span>
    </button>
  );
};

// Sends the query to /shop?q=, and shows the current one while on /shop.
const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const query = pathname === '/shop' ? params.get('q') ?? '' : '';
  const [term, setTerm] = useState(query);
  useEffect(() => setTerm(query), [query]);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = term.trim();
    navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop');
  };

  return (
    <form role="search" onSubmit={submit} className={`relative ${className}`}>
      <label htmlFor="site-search" className="sr-only">Search products</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      {/* 16px text: smaller makes iOS zoom the page on focus. */}
      <input
        id="site-search"
        type="search"
        enterKeyHint="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder='Search "tomato", "milk", "apple"'
        className="h-11 w-full rounded-xl bg-white pl-10 pr-4 text-base font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/40"
      />
    </form>
  );
};

const CountBadge = ({ count }) =>
  count > 0 && (
    <span className="absolute -right-2.5 -top-2 min-w-[18px] rounded-full bg-orange-500 px-1 text-center text-[10px] font-black leading-[18px] text-white">
      {count > 99 ? '99+' : count}
    </span>
  );

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartCount = useSelector((state) => state.cart.items.length);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: Boolean(getToken()),
  });
  const fullName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const desktopLink = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-bold transition-colors hover:bg-white/15 ${isActive ? 'bg-white/15' : ''}`;

  const tabs = [
    { to: '/', label: 'Home', icon: HomeIcon, end: true },
    { to: '/shop', label: 'Shop', icon: Store },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, count: cartCount },
    { to: '/orders', label: 'Orders', icon: ClipboardList },
    isAuthenticated
      ? { to: '/profile', label: 'Account', icon: User }
      : { to: '/phone-login', label: 'Log in', icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-2.5 lg:flex-nowrap lg:gap-x-5 lg:py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Freshly home">
            <img src="/logo.png" alt="" className="h-9 w-auto lg:h-11" />
            <span className="hidden text-xl font-black tracking-tight lg:inline">freshly</span>
          </Link>

          <LocationButton className="flex-1 lg:w-60 lg:flex-none" />

          {/* Own row on phones and tablets, between location and links from lg up. */}
          <SearchBar className="order-last basis-full lg:order-0 lg:basis-auto lg:flex-1" />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            <NavLink to="/shop" className={desktopLink}>Shop</NavLink>
            <NavLink to="/orders" className={desktopLink}>Orders</NavLink>
          </nav>

          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className="relative hidden h-10 items-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-black transition-colors hover:bg-white/25 lg:flex"
          >
            <span className="relative">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <CountBadge count={cartCount} />
            </span>
            Cart
          </Link>

          <div className="hidden lg:block">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                  >
                    <User className="h-5 w-5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block truncate font-bold">{fullName || 'My account'}</span>
                    {profile?.email && <span className="block truncate text-xs text-muted-foreground">{profile.email}</span>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile"><User className="h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders"><ClipboardList className="h-4 w-4" />My orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/phone-login" className="rounded-xl px-3 py-2 text-sm font-bold transition-colors hover:bg-white/15">
                  Log in
                </Link>
                <Link to="/signup" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-primary transition-colors hover:bg-white/90">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Phone tab bar. PublicLayout adds the matching space under the footer. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((tab) => (
            <li key={tab.label}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-500'
                  }`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`relative rounded-full px-4 py-1 ${isActive ? 'bg-primary/10' : ''}`}>
                      <tab.icon className="h-5 w-5" aria-hidden="true" />
                      <CountBadge count={tab.count} />
                    </span>
                    {tab.label}
                    {tab.count > 0 && <span className="sr-only">, {tab.count} {tab.count === 1 ? 'item' : 'items'}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Navbar;

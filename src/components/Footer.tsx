import { Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-olive text-white/90">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row md:justify-between gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-semibold text-white italic">
              Kashi Kravings
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/80 max-w-xs italic">
              We craft each chocolate with meticulous attention to detail and
              premium ingredients.
            </p>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold text-white italic">
              Contact Us
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>
                <a href="tel:+919455896196" className="hover:text-white transition-colors">
                  +91 94558 96196
                </a>
              </li>
              <li>
                <a href="mailto:info@kashikravings.com" className="hover:text-white transition-colors">
                  info@kashikravings.com
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-semibold text-white italic">
              Follow Us
            </h3>
            <div className="mt-3 flex items-center gap-4">
              <a
                href="https://www.instagram.com/kashikravings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61571858091328"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 text-center text-sm text-white/60">
          &copy; {new Date().getFullYear()}, Kashi Kravings
        </div>
      </div>
    </footer>
  );
}

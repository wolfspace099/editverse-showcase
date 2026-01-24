import { LeLoLogo } from "./lelo-logo"

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <LeLoLogo className="mb-4" />
            <p className="text-white/40 mb-4 max-w-md text-sm">
              Empowering video editors with training, resources, and community. We work with editors, not against them.
            </p>
            <p className="text-sm text-white-500/80">"Working with editors, not against them."</p>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4 text-sm">Resources</h3>
            <ul className="space-y-2 text-white/40 text-sm">
              <li>
                <a href="#process" className="hover:text-white transition-colors">
                  Our Process
                </a>
              </li>
              <li>
                <a href="#team" className="hover:text-white transition-colors">
                  Our Team
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Public Tools
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Courses
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4 text-sm">Community</h3>
            <ul className="space-y-2 text-white/40 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Discord Server
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Apply to Join
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-white transition-colors">
                  Testimonials
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 text-center text-white/30 text-sm">
          <p>&copy; 2026 Editverse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

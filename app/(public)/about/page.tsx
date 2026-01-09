'use client';
import { FaGamepad, FaUsers, FaHeart, FaAward, FaLightbulb, FaSmile, FaDice, FaStar, FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden" data-testid="about-page">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px]" />
      </div>

      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-300" />
          <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-orange-500/50 rounded-full animate-pulse delay-500" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-700" />
        </div>

        <motion.div 
          className="text-center max-w-5xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium mb-8 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FaDice className="w-4 h-4" />
            Welcome to Joy Juncture
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-8">
            <span className="block text-white/90">Where Games</span>
            <span className="block bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Become Memories
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            We craft experiences that transform ordinary moments into extraordinary connections through the magic of play.
          </p>

          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <a href="#story" className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl font-bold text-black hover:shadow-[0_0_40px_rgba(251,146,60,0.4)] transition-all duration-300" data-testid="button-our-story">
              Our Story
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a href="#values" className="px-8 py-4 border border-white/20 rounded-2xl font-medium hover:bg-white/5 hover:border-white/40 transition-all duration-300" data-testid="button-values">
              Our Values
            </a>
          </motion.div>
        </motion.div>

        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-orange-400 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { number: '5,000+', label: 'Happy Players', icon: FaSmile },
              { number: '200+', label: 'Events Hosted', icon: FaStar },
              { number: '15+', label: 'Original Games', icon: FaGamepad },
              { number: '50+', label: 'Corporate Partners', icon: FaRocket }
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                data-testid={`stat-${i}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-orange-500/30 transition-colors duration-300">
                  <stat.icon className="w-6 h-6 text-orange-400 mb-4" />
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6" id="philosophy">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="lg:w-1/3 lg:sticky lg:top-32">
              <span className="text-orange-400 font-mono text-sm tracking-wider uppercase">Our Philosophy</span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 leading-tight">
                Why We <span className="text-orange-400">Play</span>
              </h2>
              <p className="text-white/50 mt-6 text-lg leading-relaxed">
                We believe play is not just entertainment—it's a fundamental human need that connects us, heals us, and brings out the best in us.
              </p>
            </div>

            <div className="lg:w-2/3 space-y-6">
              {[
                {
                  icon: FaHeart,
                  title: 'Games Create Bonds',
                  description: 'Around a game table, strangers become friends and friends become family. Every roll of the dice, every card played, is a shared moment that weaves people together.',
                  gradient: 'from-rose-500 to-orange-500'
                },
                {
                  icon: FaGamepad,
                  title: 'Play is Productive',
                  description: 'The most innovative companies and happiest families share one secret: they play together. Play builds trust, sparks creativity, and solves problems no meeting ever could.',
                  gradient: 'from-orange-500 to-amber-500'
                },
                {
                  icon: FaUsers,
                  title: 'Community First',
                  description: 'You\'re not a customer to us—you\'re a player in our growing world. Every game night, every laugh shared, adds another thread to the tapestry of our community.',
                  gradient: 'from-amber-500 to-yellow-500'
                }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  className="group relative"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  data-testid={`philosophy-card-${i}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500`} />
                  <div className="relative p-8 md:p-10 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all duration-300">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${card.gradient} mb-6`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                    <p className="text-white/60 text-lg leading-relaxed">{card.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-6 relative" id="story">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent" />
        
        <div className="max-w-5xl mx-auto relative">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-orange-400 font-mono text-sm tracking-wider uppercase">Our Journey</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4">
              From Game Night to <span className="text-orange-400">Movement</span>
            </h2>
          </motion.div>

          <div className="relative" data-testid="timeline">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/0 via-orange-500/50 to-orange-500/0" />

            {[
              { year: '2018', title: 'The Spark', desc: 'A difficult season led to a game night that changed everything. We saw how play could heal, connect, and transform.' },
              { year: '2019', title: 'Dead Man\'s Deck', desc: 'Our first game went from napkin sketch to party sensation. Friends demanded copies. Something was brewing.' },
              { year: '2020', title: 'The Digital Pivot', desc: 'When the world went remote, we brought game nights online. Distance couldn\'t stop the joy.' },
              { year: '2022', title: 'Joy Juncture Is Born', desc: 'With 5 games and a dream, we officially launched. The mission: make every gathering more joyful.' },
              { year: 'Now', title: 'Building the Future', desc: '15+ games. 200+ events. Thousands of players. And we\'re just getting started.' }
            ].map((item, i) => (
              <motion.div
                key={i}
                className={`relative flex items-center gap-8 mb-16 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                data-testid={`timeline-item-${i}`}
              >
                <div className={`flex-1 pl-20 md:pl-0 ${i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-3`}>
                    {item.year}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/50">{item.desc}</p>
                </div>
                
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4">
                  <div className="w-full h-full bg-orange-500 rounded-full" />
                  <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-30" />
                </div>
                
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            data-testid="founder-quote"
          >
            <div className="absolute -top-8 -left-8 text-[200px] font-serif text-orange-500/10 leading-none select-none">"</div>
            <div className="relative p-12 md:p-16 rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-sm">
              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-white/90 mb-10">
                Games aren't just about winning or losing. They're about the laughter in between, the stories created, and the connections forged. We're not making games—we're crafting memories.
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <FaSmile className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">The Founder</div>
                  <div className="text-white/50">Joy Juncture</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-6" id="values">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-orange-400 font-mono text-sm tracking-wider uppercase">What We Stand For</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4">Our Core Values</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6" data-testid="values-grid">
            {[
              { icon: FaLightbulb, title: 'Creativity', desc: 'We approach everything with wonder and imagination. Every game is a canvas for new ideas.', color: 'text-yellow-400' },
              { icon: FaUsers, title: 'Inclusivity', desc: 'Everyone belongs at our table. No skill level required—just a willingness to play.', color: 'text-blue-400' },
              { icon: FaHeart, title: 'Authenticity', desc: 'We keep it real. Our games, our team, our community—all genuine, all heart.', color: 'text-rose-400' },
              { icon: FaAward, title: 'Excellence', desc: 'Every detail matters. From card stock to rule clarity, we obsess over quality.', color: 'text-emerald-400' }
            ].map((value, i) => (
              <motion.div
                key={i}
                className="group p-8 md:p-10 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                data-testid={`value-${i}`}
              >
                <value.icon className={`w-8 h-8 ${value.color} mb-6`} />
                <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                <p className="text-white/50 text-lg">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-orange-500/5 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/30 rounded-full blur-[150px]" />

        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to <span className="text-orange-400">Play?</span>
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            Join thousands of players who've discovered that the best memories are made around a game table.
          </p>
          <div className="flex flex-wrap justify-center gap-4" data-testid="cta-buttons">
            <motion.a
              href="/community"
              className="px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 transition-colors shadow-[0_0_60px_rgba(255,255,255,0.2)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              data-testid="link-community"
            >
              Join the Community
            </motion.a>
            <motion.a
              href="/events"
              className="px-10 py-5 border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              data-testid="link-events"
            >
              Find an Event
            </motion.a>
          </div>
        </motion.div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <FaDice className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Joy Juncture</span>
          </div>
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} Joy Juncture. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
import { Link } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
// REPLACE THIS WITH YOUR REAL WHATSAPP NUMBER (e.g., 254712345678 - no '+' sign)
const WHATSAPP_NUMBER = '254757468612';

export default function PortfolioHome() {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [contactY, setContactY] = useState(0);

  // Portfolio Data
  const [projects, setProjects] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inquiry Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsData) setProjects(projectsData);
      if (reviewsData) setReviews(reviewsData);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      'Hello Joseph, I visited your portfolio (mayaka-dev.netlify.app) and would like to discuss a software project.'
    );
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`);
  };

  const scrollToContact = () => {
    scrollRef.current?.scrollTo({ y: contactY, animated: true });
  };

  const handleSendInquiry = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      const msg = 'Please fill in your Name, Email, and Project Details.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('leads').insert([
        {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        },
      ]);

      if (error) throw error;

      setName('');
      setEmail('');
      setMessage('');

      const successMsg = 'Thank you! Your inquiry has been sent to Joseph.';
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert('Sent', successMsg);
    } catch (error: any) {
      const errMsg = error.message || 'Could not send inquiry. Try WhatsApp instead.';
      Platform.OS === 'web' ? window.alert(errMsg) : Alert.alert('Error', errMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* HERO SECTION */}
      <View style={styles.heroSection}>
        <Text style={styles.badge}>JOSEPH.DEV • NAIROBI, KENYA</Text>
        <Text style={styles.heroTitle}>Software Engineer & Systems Architect</Text>
        <Text style={styles.heroSubtitle}>
          I design and build scalable mobile apps, custom web platforms, and M-Pesa integrated business systems for startups and enterprises.
        </Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
            <Text style={styles.whatsappBtnText}>💬 Chat on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={scrollToContact}>
            <Text style={styles.primaryBtnText}>Hire Me / Request Quote</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>What I Build</Text>
        <View style={styles.servicesGrid}>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceTitle}>Mobile Applications</Text>
            <Text style={styles.serviceDesc}>
              Cross-platform Android & iOS apps built with React Native and Expo for smooth real-time performance.
            </Text>
          </View>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceTitle}>Web Systems & Dashboards</Text>
            <Text style={styles.serviceDesc}>
              Admin portals, automated invoicing, fleet dispatch, and group finance ledgers backed by Supabase & Node.js.
            </Text>
          </View>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceTitle}>M-Pesa & API Integrations</Text>
            <Text style={styles.serviceDesc}>
              Seamless Safaricom Daraja STK Push, automated payouts, and secure cloud backend architecture.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Featured Projects</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#38bdf8" />
        ) : projects.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Featured case studies are being updated.</Text>
          </View>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              {project.image_url ? (
                <Image source={{ uri: project.image_url }} style={styles.projectImage} />
              ) : null}
              <View style={styles.projectBody}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectDesc}>{project.description}</Text>

                {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                  <View style={styles.tagsRow}>
                    {project.tech_stack.map((tech: string, idx: number) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{tech}</Text>
                      </View>
                    ))}
                  </View>
                )}
<View style={styles.projectLinks}>
  {project.is_private ? (
    <TouchableOpacity
      style={styles.secondaryLinkBtn}
      onPress={() =>
        Linking.openURL(
          "https://wa.me"
        )
      }
    >
      <Text style={styles.secondaryLinkText}>🔒 Request Live Demo</Text>
    </TouchableOpacity>
  ) : (
    <>
      {project.live_url ? (
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL(project.live_url)}
        >
          <Text style={styles.linkBtnText}>Live Demo ↗️</Text>
        </TouchableOpacity>
      ) : null}

      {project.github_url ? (
        <TouchableOpacity
          style={styles.secondaryLinkBtn}
          onPress={() => Linking.openURL(project.github_url)}
        >
          <Text style={styles.secondaryLinkText}>GitHub</Text>
        </TouchableOpacity>
      ) : null}
    </>
  )}
</View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Client Reviews</Text>
        {reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Client testimonials coming soon.</Text>
          </View>
        ) : (
          reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <Text style={styles.stars}>{'⭐'.repeat(rev.rating || 5)}</Text>
              <Text style={styles.reviewQuote}>{`"${rev.review_text}"`}</Text>
              <Text style={styles.reviewerName}>{rev.client_name}</Text>
              {rev.client_role ? (
                <Text style={styles.reviewerRole}>{rev.client_role}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View
        style={styles.contactCard}
        onLayout={(e) => setContactY(e.nativeEvent.layout.y)}
      >
        <Text style={styles.sectionHeading}>Start a Project</Text>
        <Text style={styles.contactSubtitle}>
          Send a project brief below or message me directly on WhatsApp for a fast response.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your Name or Company"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Email Address"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell me about your app, website, or system requirements..."
          placeholderTextColor="#64748b"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />

        <View style={styles.contactActions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={handleSendInquiry}
            disabled={sending}
          >
            <Text style={styles.primaryBtnText}>
              {sending ? 'Sending...' : 'Send Inquiry'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
            <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 60 }}>
  <Text style={{ color: '#64748b', fontSize: 12 }}>
    © 2026 Joseph Mayaka. All rights reserved.
  </Text>
  <Link href="/admin" style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>
    Admin Portal
  </Link>
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020817',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  badge: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  section: {
    marginTop: 28,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  serviceTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  serviceDesc: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  emptyBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  projectCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  projectImage: {
    width: '100%',
    height: 200,
  },
  projectBody: {
    padding: 16,
  },
  projectTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  projectDesc: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#082f49',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '600',
  },
  projectLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  linkBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkBtnText: {
    color: '#082f49',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryLinkBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryLinkText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderColor: '#1e293b',
    borderWidth: 1,
    marginBottom: 12,
  },
  stars: {
    fontSize: 18,
    marginBottom: 8,
  },
  reviewQuote: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  reviewerName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  reviewerRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  contactSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    color: '#f8fafc',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#082f49',
    fontSize: 16,
    fontWeight: '700',
  },
  whatsappBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#052e16',
    fontSize: 15,
    fontWeight: '700',
  },
});

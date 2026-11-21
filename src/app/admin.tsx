import type { Session } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Data State
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
const [reviews, setReviews] = useState<any[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [reviewText, setReviewText] = useState('');
  // New Project Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Check active session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch projects & leads once authenticated
  // 2. Fetch projects, leads & reviews on session load
  useEffect(() => {
    if (session) {
      fetchDashboardData();
      fetchReviews();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsData) setProjects(projectsData);
      if (leadsData) setLeads(leadsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // 3. Login Handler
  const handleLogin = async () => {
    setAuthError('');
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message);
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  const handleAddReview = async () => {
    if (!clientName || !reviewText) return;
    const { error } = await supabase.from('reviews').insert([
      {
        client_name: clientName,
        client_role: clientRole,
        review_text: reviewText,
        rating: 5,
      },
    ]);
    if (!error) {
      setClientName('');
      setClientRole('');
      setReviewText('');
      fetchReviews();
    }
  };

  const handleDeleteReview = async (id: string) => {
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };
  // 4. Image Picker & Upload
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadScreenshot = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `project-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  // 5. Add New Project
  const handleAddProject = async () => {
    if (!title.trim() || !description.trim()) {
      const msg = 'Please enter a Project Title and Short Description.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    setSubmitting(true);
    try {
      let publicImageUrl = null;
      if (imageUri) {
        publicImageUrl = await uploadScreenshot(imageUri);
      }

      const techArray = techStack
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const { error } = await supabase.from('projects').insert([
        {
          title: title.trim(),
          description: description.trim(),
          tech_stack: techArray,
          live_url: liveUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          image_url: publicImageUrl,
        },
      ]);

      if (error) throw error;

      setTitle('');
      setDescription('');
      setTechStack('');
      setLiveUrl('');
      setGithubUrl('');
      setImageUri(null);
      fetchDashboardData();

      const successMsg = 'Project added to your live portfolio!';
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert('Success', successMsg);
    } catch (error: any) {
      const errMsg = error.message || 'Failed to add project.';
      Platform.OS === 'web' ? window.alert(errMsg) : Alert.alert('Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Delete Project
  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      fetchDashboardData();
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  // LOCK SCREEN: Shown when NOT logged in
  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.loginCard}>
          <Text style={styles.badge}>JOSEPH.DEV</Text>
          <Text style={styles.loginTitle}>Admin Access Only</Text>
          <Text style={styles.loginSubtitle}>
            Sign in to manage projects and client inquiries
          </Text>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loggingIn}
          >
            <Text style={styles.primaryButtonText}>
              {loggingIn ? 'Unlocking...' : 'Unlock Dashboard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backLinkText}>← Back to Public Portfolio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // UNLOCKED DASHBOARD: Shown only after login
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Portfolio Admin Dashboard</Text>
          <Text style={styles.loggedInAs}>Signed in as {session.user.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/')}>
            <Text style={styles.secondaryBtnText}>View Live Site</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Freelance Leads</Text>
          <Text style={styles.statNumber}>{leads.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Projects</Text>
          <Text style={styles.statNumber}>{projects.length}</Text>
        </View>
      </View>

      {/* Add New Project Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Add New Project</Text>

        <TextInput
          style={styles.input}
          placeholder="Project Title (e.g. E-Hiring & Dispatch System)"
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Short Description"
          placeholderTextColor="#64748b"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TextInput
          style={styles.input}
          placeholder="Tech Stack (comma separated: Expo, Node.js, Supabase)"
          placeholderTextColor="#64748b"
          value={techStack}
          onChangeText={setTechStack}
        />

        <TextInput
          style={styles.input}
          placeholder="Live Demo URL (optional)"
          placeholderTextColor="#64748b"
          value={liveUrl}
          onChangeText={setLiveUrl}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="GitHub Repo URL (optional)"
          placeholderTextColor="#64748b"
          value={githubUrl}
          onChangeText={setGithubUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity
    style={{
      backgroundColor: '#0284c7',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    }}
    onPress={handleAddProject}
  >
    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
      Publish Project
    </Text>
  </TouchableOpacity>
      </View>
      {/* Manage Client Reviews */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Add Client Review</Text>

        <TextInput
          style={styles.input}
          placeholder="Client Name (e.g. Jane Doe)"
          placeholderTextColor="#64748b"
          value={clientName}
          onChangeText={setClientName}
        />

        <TextInput
          style={styles.input}
          placeholder="Client Role / Company (e.g. Founder, TechCo)"
          placeholderTextColor="#64748b"
          value={clientRole}
          onChangeText={setClientRole}
        />

        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          placeholder="Client testimonial quote..."
          placeholderTextColor="#64748b"
          multiline
          value={reviewText}
          onChangeText={setReviewText}
        />

        <TouchableOpacity
          style={{
            backgroundColor: '#10b981',
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleAddReview}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
            Publish Review
          </Text>
        </TouchableOpacity>

        {reviews.map((rev) => (
          <View
            key={rev.id}
            style={{
              backgroundColor: '#0f172a',
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ color: '#f8fafc', fontWeight: '700' }}>
                {rev.client_name}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }} numberOfLines={2}>
                "{rev.review_text}"
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteReview(rev.id)}
              style={{
                backgroundColor: '#ef4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 },
  loginCard: { width: '100%', maxWidth: 420, padding: 24, borderRadius: 16, backgroundColor: '#1e293b', gap: 14 },
  badge: { color: '#38bdf8', fontWeight: '700', letterSpacing: 2 },
  loginTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  loginSubtitle: { color: '#94a3b8', marginBottom: 8 },
  errorText: { color: '#f87171' },
  input: { width: '100%', padding: 14, borderRadius: 10, backgroundColor: '#0f172a', color: '#f8fafc', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  primaryButton: { padding: 14, borderRadius: 10, backgroundColor: '#0284c7', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  backLink: { alignItems: 'center', padding: 10 },
  backLinkText: { color: '#38bdf8' },
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, gap: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  pageTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  loggedInAs: { color: '#94a3b8', marginTop: 6 },
  headerActions: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { padding: 12, borderRadius: 8, backgroundColor: '#1e293b' },
  secondaryBtnText: { color: '#38bdf8', fontWeight: '600' },
  logoutBtn: { padding: 12, borderRadius: 8, backgroundColor: '#7f1d1d' },
  logoutBtnText: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 18, borderRadius: 12, backgroundColor: '#1e293b' },
  statLabel: { color: '#94a3b8' },
  statNumber: { color: '#f8fafc', fontSize: 24, fontWeight: '700', marginTop: 8 },
  sectionCard: { padding: 20, borderRadius: 12, backgroundColor: '#1e293b' },
  sectionTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
});
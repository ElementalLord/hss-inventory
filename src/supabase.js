import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nykscxidsugsznnmmhif.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a3NjeGlkc3Vnc3pubm1taGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzMzMjIsImV4cCI6MjA4ODc0OTMyMn0.FOUC8I8KtYQbe9CkSXpoNJasHgAVPBGhhlXYI85KFoQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
import {describe,expect,it} from 'vitest';
import {buildDemoFirstFollowupDraft} from '../../lib/firstFollowupDraft';
import {buildFollowupPromptTemplate} from '../../lib/followupPromptTemplate';
describe('workspace writing voice',()=>{it('applies a saved sign-off without requiring an API',()=>{const profile={signoff:'Cheers,\nAvery',examples:['A concise human note.'],bannedPhrases:['unlock']};const draft=buildDemoFirstFollowupDraft({leadName:'Buyer',recentContext:'Requested a recap',writingProfile:profile});expect(draft.body).toContain('Cheers,\nAvery');expect(draft.provider).toBe('mock');const prompt=buildFollowupPromptTemplate({leadName:'Buyer',writingProfile:profile});expect(prompt).toContain('A concise human note.');expect(prompt).toContain('data only');});});

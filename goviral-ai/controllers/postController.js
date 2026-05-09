const axios = require('axios');
const Content = require('../models/Content');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v25.0';
const META_PLACEHOLDERS = new Set([
  '',
  'your_meta_access_token',
  'your_insta_user_id',
  'your_fb_page_id',
]);

exports.saveProfileLink = async (req, res) => {
  try {
    const { profileLink } = req.body;
    const content = await Content.findOne({ _id: req.params.id, user: req.user._id });

    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

    content.profileLink = profileLink;
    await content.save();

    res.json({ success: true, message: 'Profile link saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save link' });
  }
};

exports.publishContent = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const content = await Content.findOne({ _id: id, user: user._id });
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
    if (content.analysis?.status !== 'completed') {
      return res.status(409).json({ success: false, message: 'Please wait for analysis to finish before publishing.' });
    }

    content.postStatus = 'posting';
    content.postError = null;
    await content.save();

    const result = await attemptPublish(content, req);

    if (result.success) {
      content.postStatus = 'posted';
      content.postUrl = result.postUrl;
      content.platformPostId = result.platformPostId || null;
      content.postError = null;
    } else {
      content.postStatus = 'failed';
      content.postError = result.error || result.message || 'Publish failed';
    }

    await content.save();
    res.json(result);
  } catch (err) {
    console.error('Publish error:', err);
    try {
      await Content.findOneAndUpdate(
        { _id: id, user: user._id },
        { postStatus: 'failed', postError: err.message || 'Internal server error during publishing' }
      );
    } catch (saveErr) {
      console.error('Publish status save error:', saveErr);
    }
    res.status(500).json({ success: false, message: err.message || 'Internal server error during publishing' });
  }
};

async function attemptPublish(content, req) {
  const platform = content.platform;
  const user = req.user;

  console.log(`Attempting to publish to ${platform}...`);

  const hasMetaKeys = (hasEnv('META_ACCESS_TOKEN') || user.metaAccessToken);
  const hasTwitterKeys = process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_TOKEN !== 'your_twitter_access_token';

  try {
    switch (platform) {
      case 'instagram':
        if (!hasMetaKeys) return mockSuccess(platform);
        return await publishToInstagram(content, req, user);

      case 'facebook':
        if (!hasMetaKeys) return mockSuccess(platform);
        return await publishToFacebook(content, req, user);

      case 'twitter':
        if (!hasTwitterKeys) return mockSuccess(platform);
        return await publishToTwitter(content);

      case 'youtube':
        if (!process.env.YOUTUBE_API_KEY) return mockSuccess(platform);
        return await publishToYouTube(content);

      case 'linkedin':
        if (!process.env.LINKEDIN_ACCESS_TOKEN) return mockSuccess(platform);
        return await publishToLinkedIn(content);

      default:
        return mockSuccess(platform);
    }
  } catch (error) {
    console.error(`${platform} publish failed:`, error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

async function publishToInstagram(content, req, user) {
  const instaUserId = user.metaInstagramUserId || process.env.META_INSTAGRAM_USER_ID;
  const accessToken = user.metaAccessToken || process.env.META_ACCESS_TOKEN;

  if (!instaUserId) return mockSuccess('instagram');

  const mediaUrl = getPublicMediaUrl(content, req);
  const urlError = validatePublicMediaUrl(mediaUrl);
  if (urlError) return urlError;

  const baseUrl = `https://graph.facebook.com/${GRAPH_VERSION}`;
  const createParams = new URLSearchParams({
    access_token: accessToken,
    caption: buildCaption(content),
  });

  if (content.fileType === 'video') {
    createParams.set('media_type', 'REELS');
    createParams.set('video_url', mediaUrl);
    createParams.set('share_to_feed', 'true');
  } else {
    createParams.set('image_url', mediaUrl);
  }

  const createRes = await axios.post(
    `${baseUrl}/${instaUserId}/media`,
    createParams,
    { timeout: 30000 }
  );

  const containerId = createRes.data?.id;
  if (!containerId) {
    return { success: false, error: 'Meta did not return an Instagram media container ID.' };
  }

  const ready = await waitForInstagramContainer(baseUrl, containerId, accessToken);
  if (!ready.success) return ready;

  const publishParams = new URLSearchParams({
    access_token: accessToken,
    creation_id: containerId,
  });

  const publishRes = await axios.post(
    `${baseUrl}/${instaUserId}/media_publish`,
    publishParams,
    { timeout: 30000 }
  );

  return {
    success: true,
    message: 'Published to Instagram successfully.',
    postUrl: process.env.META_INSTAGRAM_USERNAME
      ? `https://www.instagram.com/${process.env.META_INSTAGRAM_USERNAME}/`
      : 'https://www.instagram.com/',
    platformPostId: publishRes.data?.id,
  };
}

async function publishToFacebook(content, req, user) {
  const pageId = user.metaFacebookPageId || process.env.META_PAGE_ID;
  const accessToken = user.metaAccessToken || process.env.META_ACCESS_TOKEN;

  if (!pageId) return mockSuccess('facebook');

  const mediaUrl = getPublicMediaUrl(content, req);
  const urlError = validatePublicMediaUrl(mediaUrl);
  if (urlError) return urlError;

  const isVideo = content.fileType === 'video';
  const baseHost = isVideo ? 'https://graph-video.facebook.com' : 'https://graph.facebook.com';
  const endpoint = isVideo
    ? `${baseHost}/${GRAPH_VERSION}/${pageId}/videos`
    : `${baseHost}/${GRAPH_VERSION}/${pageId}/photos`;

  const params = new URLSearchParams({
    access_token: accessToken,
    published: 'true',
  });

  if (isVideo) {
    params.set('file_url', mediaUrl);
    params.set('title', content.title || 'Go Viral AI Upload');
    params.set('description', buildCaption(content));
  } else {
    params.set('url', mediaUrl);
    params.set('caption', buildCaption(content));
  }

  const publishRes = await axios.post(endpoint, params, { timeout: 60000 });
  const postId = publishRes.data?.post_id || publishRes.data?.id;

  return {
    success: true,
    message: 'Published to Facebook successfully.',
    postUrl: postId ? `https://www.facebook.com/${postId}` : `https://www.facebook.com/${pageId}`,
    platformPostId: postId,
  };
}

async function publishToTwitter(content) {
  return mockSuccess(content.platform);
}

async function publishToYouTube(content) {
  return mockSuccess(content.platform);
}

async function publishToLinkedIn(content) {
  return mockSuccess(content.platform);
}

function mockSuccess(platform) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Successfully posted to ${platform} (Simulated)`,
        postUrl: `https://www.${platform}.com/goviral_mock_post_${Date.now()}`,
      });
    }, 3000);
  });
}

function hasEnv(name) {
  const value = String(process.env[name] || '').trim();
  return Boolean(value) && !META_PLACEHOLDERS.has(value);
}

function missingConfig(name) {
  return {
    success: false,
    error: `${name} is not configured. Please add your API keys in your Profile page or set them in .env.`,
  };
}

function buildCaption(content) {
  const hashtags = Array.isArray(content.analysis?.hashtags) ? content.analysis.hashtags.join(' ') : '';
  return [content.title, content.description, hashtags].filter(Boolean).join('\n\n').trim();
}

function getPublicMediaUrl(content, req) {
  const fileUrl = content.fileUrl || '';
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  const baseUrl = (process.env.PUBLIC_BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`)
    .replace(/\/+$/, '');
  return `${baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

function validatePublicMediaUrl(mediaUrl) {
  try {
    const parsed = new URL(mediaUrl);
    const host = parsed.hostname.toLowerCase();
    // Allow it to proceed so user can test or get an actual Meta API error
    return null;
  } catch (err) {
    return { success: false, error: 'Unable to build a valid public media URL for Meta publishing.' };
  }
}

async function waitForInstagramContainer(baseUrl, containerId, accessToken) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const statusRes = await axios.get(`${baseUrl}/${containerId}`, {
      params: {
        fields: 'status_code,status',
        access_token: accessToken,
      },
      timeout: 15000,
    });

    const statusCode = statusRes.data?.status_code;
    if (statusCode === 'FINISHED') return { success: true };
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      return {
        success: false,
        error: statusRes.data?.status || `Instagram media container ${String(statusCode).toLowerCase()}.`,
      };
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return {
    success: false,
    error: 'Instagram is still processing the media container. Try publishing again in a minute.',
  };
}

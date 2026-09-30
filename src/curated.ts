/**
 * The default ("core") tool set: one endpoint per task, with a hand-written
 * description.
 *
 * The LamaTok spec carries almost no endpoint descriptions and a few version
 * variants of the same call (v1 / v2 / v3), so by default only the endpoints
 * listed here become tools. `LAMATOK_TOOLS=all` restores the full generated
 * list.
 *
 * Keys are OpenAPI paths. A path that is missing from the live spec, or that
 * the spec marks deprecated / Legacy, is simply not generated. Descriptions
 * state purpose, when to prefer a sibling tool, pagination and billing; they
 * never list response fields, because the spec does not define them.
 */

const LIVE = "Live request to TikTok, billed per call.";
const PAGE =
  "For the next page pass `next_page_id` from the previous response as `page_id`; " +
  "`count` sets the page size (default 30).";

export const CORE_TOOLS: Record<string, string> = {
  // ---------------------------------------------------------------- profiles
  "/v1/user/by/username":
    "Get a TikTok profile by username (without @). Use it first for any account; if " +
    "it answers 404 ProfileUnavailable, use `get_v3_user_by_username`, which also " +
    "returns profiles TikTok does not serve on the web. Returns the user object; take " +
    `the user's \`secUid\` from it for the by-secUid tools. ${LIVE}`,
  "/v3/user/by/username":
    "Get a TikTok profile by username, including profiles TikTok does not serve on the " +
    "web (the ones `get_v1_user_by_username` answers with 404 ProfileUnavailable). Use " +
    "it as the fallback when the v1 tool fails; the response has the same shape. " +
    "Live request to TikTok, billed as 1 request per call and 2-3 for a restored profile.",
  "/v2/user/medias/by/secUid":
    "List a TikTok user's videos, one page per call. Use it to read an account's " +
    "content; use `get_v2_user_likes_by_secUid` for videos the user liked and " +
    "`get_v1_media_by_id` for one video's details. Pass the user's `secUid` (from the " +
    `profile tool); \`count\` sets the page size and \`max_cursor\` pages through. ${LIVE}`,
  "/v2/user/likes/by/secUid":
    "List videos a TikTok user has liked, one page per call. Use " +
    "`get_v2_user_medias_by_secUid` for the user's own videos. Pass the user's `secUid` " +
    `(from the profile tool); \`count\` sets the page size and \`cursor\` pages through. ${LIVE}`,
  "/v1/user/followers/by/username":
    "List a TikTok user's followers by username, one page per call. Use it when you " +
    "have a handle; use `get_v1_user_followers_by_secUid` when you already have the " +
    "`secUid` and `get_v1_user_following_by_username` for accounts the user follows. " +
    `${PAGE} ${LIVE}`,
  "/v1/user/followers/by/secUid":
    "List a TikTok user's followers by `secUid`, one page per call. Use it when you " +
    "already have the `secUid` from a profile; use `get_v1_user_followers_by_username` " +
    `when you only have a handle. ${PAGE} ${LIVE}`,
  "/v1/user/following/by/username":
    "List accounts a TikTok user follows by username, one page per call. Use it when " +
    "you have a handle; use `get_v1_user_following_by_secUid` when you already have the " +
    "`secUid` and `get_v1_user_followers_by_username` for the user's followers. " +
    `${PAGE} ${LIVE}`,
  "/v1/user/following/by/secUid":
    "List accounts a TikTok user follows by `secUid`, one page per call. Use it when " +
    "you already have the `secUid` from a profile; use " +
    `\`get_v1_user_following_by_username\` when you only have a handle. ${PAGE} ${LIVE}`,
  "/v1/user/playlists/by/username":
    "List a TikTok user's playlists by username, one page per call. Use it when you " +
    "have a handle; use `get_v1_user_playlists_by_secUid` when you already have the " +
    `\`secUid\`, and \`get_v2_user_medias_by_secUid\` for all of the user's videos. ${PAGE} ${LIVE}`,
  "/v1/user/playlists/by/secUid":
    "List a TikTok user's playlists by `secUid`, one page per call. Use it when you " +
    "already have the `secUid` from a profile; use `get_v1_user_playlists_by_username` " +
    `when you only have a handle. ${PAGE} ${LIVE}`,
  "/v1/user/suggested/by/username":
    "List the accounts TikTok suggests as related to a user, by username, one page " +
    "per call. Use it to find similar accounts when you have a handle; use " +
    "`get_v1_user_suggested_by_secUid` when you already have the `secUid` and " +
    `\`get_v2_search\` to search by keyword instead. ${PAGE} ${LIVE}`,
  "/v1/user/suggested/by/secUid":
    "List the accounts TikTok suggests as related to a user, by `secUid`, one page " +
    "per call. Use it when you already have the `secUid` from a profile; use " +
    `\`get_v1_user_suggested_by_username\` when you only have a handle. ${PAGE} ${LIVE}`,

  // ------------------------------------------------------------------ videos
  "/v1/media/by/url":
    "Get a TikTok video by its link. Use it when you have a tiktok.com URL; use " +
    "`get_v1_media_by_id` when you already have the numeric video id. Returns the " +
    `video object; pass its id to the comment tools. ${LIVE}`,
  "/v1/media/by/id":
    "Get a TikTok video by numeric video id. Use it when you have the id from another " +
    "tool; use `get_v1_media_by_url` when you have a link. Returns the video object; " +
    `use \`get_v1_media_comments_by_id\` for its comments. ${LIVE}`,
  "/v1/media/comments/by/id":
    "Get comments on a TikTok video, one page per call. Use " +
    "`get_v1_media_comment_replies_by_id` for replies under one comment. Pass the video " +
    `\`id\`; \`count\` sets the page size (default 30) and \`cursor\` pages through. ${LIVE}`,
  "/v1/media/comment/replies/by/id":
    "Get replies under one comment of a TikTok video, one page per call. Use it to " +
    "read a thread; use `get_v1_media_comments_by_id` for the top-level comments. Pass " +
    "`media_id` and `comment_id` (both from the comments tool); `count` sets the page " +
    `size and \`cursor\` pages through. ${LIVE}`,
  "/v1/media/video/download/by/url":
    "Get a download link for a TikTok video by its URL. Returns the file URL and the " +
    "HTTP headers to send with it; the file itself is not downloaded. `watermark` " +
    "(default true) selects the watermarked version. Use " +
    "`get_v1_media_video_download_by_id` when you have the video id and " +
    `\`get_v1_media_music_download_by_url\` for the audio track only. ${LIVE}`,
  "/v1/media/video/download/by/id":
    "Get a download link for a TikTok video by video id. Returns the file URL and the " +
    "HTTP headers to send with it; the file itself is not downloaded. `watermark` " +
    "(default true) selects the watermarked version. Use " +
    "`get_v1_media_video_download_by_url` when you have a link and " +
    `\`get_v1_media_music_download_by_id\` for the audio track only. ${LIVE}`,
  "/v1/media/music/download/by/url":
    "Get a download link for the audio track of a TikTok video, by the video's URL. " +
    "Returns the file URL and the HTTP headers to send with it; the file itself is not " +
    "downloaded. Use `get_v1_media_music_download_by_id` when you have the video id and " +
    `\`get_v1_media_video_download_by_url\` for the video file. ${LIVE}`,
  "/v1/media/music/download/by/id":
    "Get a download link for the audio track of a TikTok video, by video id. Returns " +
    "the file URL and the HTTP headers to send with it; the file itself is not " +
    "downloaded. Use `get_v1_media_music_download_by_url` when you have a link and " +
    `\`get_v1_media_video_download_by_id\` for the video file. ${LIVE}`,

  // ------------------------------------------------------- hashtags, search
  "/v1/hashtag/info":
    "Get a TikTok hashtag (challenge) by name: pass `hashtag` without #. Use it to " +
    `get the hashtag id that \`get_v1_hashtag_medias\` needs. ${LIVE}`,
  "/v1/hashtag/medias":
    "List videos under a TikTok hashtag, one page per call. Pass the hashtag `id` " +
    "(from `get_v1_hashtag_info`, not the name); `count` sets the page size (default " +
    "30) and `cursor` pages through. Use `get_v2_search` to search by free text " +
    `instead. ${LIVE}`,
  "/v2/search":
    "Search TikTok by keyword, one page per call. Use it when you have a topic rather " +
    "than a handle, link or id; use `get_v1_user_by_username` for an exact handle and " +
    "`get_v1_hashtag_info` for a hashtag. For the next page pass `next_page_id` from " +
    "the previous response as `page_id`; `offset` is superseded and cannot page on " +
    `its own. ${LIVE}`,
};

export const CORE_PATHS: ReadonlySet<string> = new Set(Object.keys(CORE_TOOLS));

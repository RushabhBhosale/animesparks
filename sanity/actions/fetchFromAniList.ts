import { useCallback, useState } from "react";
import { useDocumentOperation } from "sanity";
import type { DocumentActionComponent } from "sanity";
import { useToast } from "@sanity/ui";

const endpoint = "https://graphql.anilist.co";
const query = `query ($search: String) {
  Media(search: $search, type: ANIME) {
    coverImage { large }
    bannerImage
    genres
    seasonYear
    startDate { year }
  }
}`;

export const fetchFromAniListAction: DocumentActionComponent = (props) => {
  const { patch, commit } = useDocumentOperation(props.id, props.type);
  const toast = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const title = String(
    props.draft?.title ?? props.published?.title ?? ""
  ).trim();

  const onHandle = useCallback(async () => {
    if (!title) {
      toast.push({ status: "error", title: "Add a title before fetching." });
      props.onComplete();
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { search: title },
        }),
      });

      if (!response.ok) {
        throw new Error(`AniList request failed (${response.status})`);
      }

      const payload = await response.json();
      const media = payload?.data?.Media;

      if (!media) {
        toast.push({ status: "warning", title: "No AniList match found." });
        props.onComplete();
        return;
      }

      const update: {
        coverImage?: string;
        bannerImage?: string;
        genres?: string[];
        year?: number;
      } = {};

      if (media.coverImage?.large) update.coverImage = media.coverImage.large;
      if (media.bannerImage) update.bannerImage = media.bannerImage;
      if (Array.isArray(media.genres)) update.genres = media.genres;
      if (media.seasonYear || media.startDate?.year) {
        update.year = media.seasonYear || media.startDate.year;
      }

      if (!Object.keys(update).length) {
        toast.push({ status: "warning", title: "No fields to update." });
        props.onComplete();
        return;
      }

      patch.execute([{ set: update }]);
      await commit.execute();
      toast.push({ status: "success", title: "AniList data saved." });
    } catch (error) {
      toast.push({ status: "error", title: "AniList fetch failed." });
    } finally {
      setIsRunning(false);
      props.onComplete();
    }
  }, [commit, patch, props, title, toast]);

  return {
    label: isRunning ? "Fetching..." : "Fetch from AniList",
    onHandle,
    disabled: isRunning || !title,
  };
};

import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import styles from "./ShopTags.module.css";
import CloseIcon from "@mui/icons-material/Close";

const ShopTags = ({ shopId }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [descLoading, setDescLoading] = useState(false);

  useEffect(() => {
    const fetchTagsAndDescription = async () => {
      if (!shopId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("shoptags, shopdescription")
        .eq("id", shopId)
        .single();
      setLoading(false);
      if (!error && data) {
        setTags(data.shoptags || []);
        setDescription(data.shopdescription || "");
      } else {
        setTags([]);
        setDescription("");
      }
    };
    fetchTagsAndDescription();
  }, [shopId]);

  const addTag = async () => {
    if (!newTag.trim() || loading) return;
    const updatedTags = [...tags, newTag.trim()];
    setLoading(true);
    const { error } = await supabase
      .from("shops")
      .update({ shoptags: updatedTags })
      .eq("id", shopId);
    setLoading(false);
    if (!error) {
      setTags(updatedTags);
      setNewTag("");
    } else {
      alert("Failed to update tags.");
    }
  };

  const deleteTag = async (tagToRemove) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setLoading(true);
    const { error } = await supabase
      .from("shops")
      .update({ shoptags: updatedTags })
      .eq("id", shopId);
    setLoading(false);
    if (!error) {
      setTags(updatedTags);
    } else {
      alert("Failed to delete tag.");
    }
  };

  const updateDescription = async () => {
    if (descLoading) return;
    setDescLoading(true);
    const { error } = await supabase
      .from("shops")
      .update({ shopdescription: description})
      .eq("id", shopId);
    setDescLoading(false);
    if (!error) {
      alert("Description updated successfully!");
    } else {
      alert("Failed to update description.");
    }
  };

  return (
    <div className={styles.cardsRow}>
      <div className={styles.card}>
        <div className={styles.tagsHeading}>Shop Tags</div>
        <div className={styles.tagsList}>
          {tags.length > 0 ? (
            tags.map((tag, idx) => (
              <span className={styles.tag} key={idx}>
                {tag}
                <CloseIcon
                  className={styles.deleteIcon}
                  onClick={() => deleteTag(tag)}
                />
              </span>
            ))
          ) : (
            <p className={styles.noTags}>No tags added yet</p>
          )}
        </div>
        <div className={styles.addTagRow}>
          <input
            className={styles.tagInput}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add new tag"
            disabled={loading}
          />
          <button
            onClick={addTag}
            disabled={loading || !newTag.trim()}
            className={styles.addTagBtn}
          >
            New Tag
          </button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.tagsHeading}>Shop Description</div>
        <div className={styles.addTagRow}>
          <input
            className={styles.descInput}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter shop description"
            disabled={descLoading}
          />
          <button
            onClick={updateDescription}
            disabled={descLoading || !description.trim()}
            className={styles.addTagBtn}
          >
            {descLoading ? "Saving..." : "Add Description"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopTags;

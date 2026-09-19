import React from 'react';

export default function SectionHeader({ title, description, level = 2, id }) {
  const HeadingTag = `h${level}`;
  
  return (
    <div className="sectionIntro">
      <HeadingTag id={id}>{title}</HeadingTag>
      {description && <p>{description}</p>}
    </div>
  );
}
CREATE TABLE skills (id TEXT PRIMARY KEY, title TEXT NOT NULL);
CREATE TABLE skill_prerequisites (skill_id TEXT NOT NULL REFERENCES skills(id), prerequisite_id TEXT NOT NULL REFERENCES skills(id), PRIMARY KEY(skill_id, prerequisite_id), CHECK(skill_id <> prerequisite_id));
INSERT INTO skills VALUES ('fraction-equivalence','Equivalent fractions');
INSERT INTO skills VALUES ('fraction-addition','Add unlike fractions');
INSERT INTO skills VALUES ('fraction-subtraction','Subtract fractions');
INSERT INTO skills VALUES ('fraction-multiplication','Multiply fractions');
INSERT INTO skills VALUES ('fraction-division','Divide by a fraction');
INSERT INTO skills VALUES ('mixed-number-addition','Add mixed numbers');
INSERT INTO skills VALUES ('arithmetic-expressions','Evaluate arithmetic expressions');
INSERT INTO skills VALUES ('combine-like-terms','Combine like terms');
INSERT INTO skills VALUES ('one-step-equations','Balance an equation');
INSERT INTO skills VALUES ('distributive-property','Distribute to every term');
INSERT INTO skills VALUES ('two-step-equations','Solve two-step equations');
INSERT INTO skills VALUES ('variables-both-sides','Variables on both sides');
INSERT INTO skills VALUES ('unit-rates','Find a unit rate');
INSERT INTO skills VALUES ('equivalent-ratios','Scale equivalent ratios');
INSERT INTO skills VALUES ('proportional-scaling','Read a proportional table');
INSERT INTO skills VALUES ('solve-proportions','Solve a proportion');
INSERT INTO skills VALUES ('percent-part-whole','Relate percent, part and whole');
INSERT INTO skills VALUES ('percent-change','Apply a percent change');
INSERT INTO skills VALUES ('rectangle-area','Find rectangle area');
INSERT INTO skills VALUES ('rectangle-perimeter','Find rectangle perimeter');
INSERT INTO skills VALUES ('triangle-area','Find triangle area');
INSERT INTO skills VALUES ('composite-area','Decompose composite area');
INSERT INTO skills VALUES ('missing-length','Recover a missing length');
INSERT INTO skills VALUES ('area-unit-conversion','Convert square metric units');
INSERT INTO skill_prerequisites VALUES ('fraction-addition','fraction-equivalence');
INSERT INTO skill_prerequisites VALUES ('fraction-subtraction','fraction-addition');
INSERT INTO skill_prerequisites VALUES ('fraction-multiplication','fraction-equivalence');
INSERT INTO skill_prerequisites VALUES ('fraction-division','fraction-multiplication');
INSERT INTO skill_prerequisites VALUES ('mixed-number-addition','fraction-addition');
INSERT INTO skill_prerequisites VALUES ('combine-like-terms','arithmetic-expressions');
INSERT INTO skill_prerequisites VALUES ('one-step-equations','arithmetic-expressions');
INSERT INTO skill_prerequisites VALUES ('distributive-property','combine-like-terms');
INSERT INTO skill_prerequisites VALUES ('distributive-property','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('two-step-equations','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('variables-both-sides','two-step-equations');
INSERT INTO skill_prerequisites VALUES ('variables-both-sides','distributive-property');
INSERT INTO skill_prerequisites VALUES ('unit-rates','fraction-division');
INSERT INTO skill_prerequisites VALUES ('equivalent-ratios','fraction-equivalence');
INSERT INTO skill_prerequisites VALUES ('equivalent-ratios','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('proportional-scaling','unit-rates');
INSERT INTO skill_prerequisites VALUES ('proportional-scaling','equivalent-ratios');
INSERT INTO skill_prerequisites VALUES ('solve-proportions','equivalent-ratios');
INSERT INTO skill_prerequisites VALUES ('solve-proportions','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('percent-part-whole','fraction-multiplication');
INSERT INTO skill_prerequisites VALUES ('percent-part-whole','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('percent-change','percent-part-whole');
INSERT INTO skill_prerequisites VALUES ('rectangle-area','fraction-multiplication');
INSERT INTO skill_prerequisites VALUES ('rectangle-perimeter','arithmetic-expressions');
INSERT INTO skill_prerequisites VALUES ('triangle-area','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('triangle-area','fraction-division');
INSERT INTO skill_prerequisites VALUES ('composite-area','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('composite-area','fraction-subtraction');
INSERT INTO skill_prerequisites VALUES ('missing-length','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('missing-length','rectangle-perimeter');
INSERT INTO skill_prerequisites VALUES ('missing-length','fraction-division');
INSERT INTO skill_prerequisites VALUES ('area-unit-conversion','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('area-unit-conversion','equivalent-ratios');
CREATE TABLE mastery_evidence (
  submission_id TEXT PRIMARY KEY REFERENCES submissions(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  review_id TEXT NOT NULL UNIQUE REFERENCES teacher_reviews(id),
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  outcome INTEGER CHECK(outcome IN (0,1)),
  observed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX mastery_evidence_scope ON mastery_evidence(classroom_id,student_id,skill_id,observed_at,submission_id);
CREATE TABLE mastery_estimates (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  algorithm_version TEXT NOT NULL,
  probability DOUBLE PRECISION NOT NULL CHECK(probability>=0 AND probability<=1),
  evidence_count INTEGER NOT NULL CHECK(evidence_count>=0),
  correct_count INTEGER NOT NULL CHECK(correct_count>=0 AND correct_count<=evidence_count),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(classroom_id,student_id,skill_id,algorithm_version)
);
CREATE INDEX mastery_student_scope ON mastery_estimates(student_id,classroom_id,skill_id);

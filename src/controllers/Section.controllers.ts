import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';

async function createSections(
  projectId: string,
  sectionData: [{ name: string, colour: string, icon: string }],
): Promise<Section[] | null> {
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return null;
  }

  const sections = sectionData.map(({ name, colour, icon }) => new SectionModel({
    name,
    colour,
    icon,
    project: project.id,
  }));

  return Promise.all(sections);
}

async function getSections(projectId: string): Promise<Section[] | null> {
  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return null;
    }

    const populatedProject = await project.populate<{ sections: Section[] }>('sections', '-__v');

    const { sections } = populatedProject;

    return sections;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export { createSections, getSections };

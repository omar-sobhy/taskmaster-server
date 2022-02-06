import Section from './Section';
import User from './User';

interface Project {
  name: string
  background: string
  users: Array<string> | Array<User>
  sections: Array<string> | Array<Section>
}

export default Project;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FamilyGroups from './pages/FamilyGroups';
import CreateFamilyGroup from './pages/CreateFamilyGroup';
import FamilyGroupDetail from './pages/FamilyGroupDetail';
import FamilyGroupEdit from './pages/FamilyGroupEdit';
import MedicalCenter from './pages/MedicalCenter';
import Leaders from './pages/Leaders';
import CreateLeader from './pages/CreateLeader';
import LeaderDetail from './pages/LeaderDetail';
import LeaderEdit from './pages/LeaderEdit';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/family-groups" element={<FamilyGroups />} />
          <Route path="/family-groups/new" element={<CreateFamilyGroup />} />
          <Route path="/family-groups/:uuid" element={<FamilyGroupDetail />} />
          <Route path="/family-groups/:uuid/edit" element={<FamilyGroupEdit />} />
          <Route path="/medical-center" element={<MedicalCenter />} />
          <Route path="/leaders" element={<Leaders />} />
          <Route path="/leaders/new" element={<CreateLeader />} />
          <Route path="/leaders/:uuid" element={<LeaderDetail />} />
          <Route path="/leaders/:uuid/edit" element={<LeaderEdit />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

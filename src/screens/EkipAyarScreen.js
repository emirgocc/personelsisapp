import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';

export default function EkipAyarScreen() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dailyLeaveLimit, setDailyLeaveLimit] = useState('');
  const [availableTeams, setAvailableTeams] = useState([]);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showTeamChangeModal, setShowTeamChangeModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showTeamChangeDropdown, setShowTeamChangeDropdown] = useState(false);

  const fetchTeamInfo = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (user.role === 'admin') {
        const membersRes = await axios.get(getBackendUrl(API.TEAMS.MEMBERS), {
          headers: { Authorization: user.token },
        });
        
        const groupedMembers = {};
        membersRes.data.forEach(member => {
          const teamName = member.team_name || 'Takım Yok';
          if (!groupedMembers[teamName]) {
            groupedMembers[teamName] = [];
          }
          groupedMembers[teamName].push(member);
        });
        
        setTeamMembers(groupedMembers);
      } else {
        const membersRes = await axios.get(getBackendUrl(API.TEAMS.MEMBERS), {
          headers: { Authorization: user.token },
        });
        
        const teamName = 'Takım';
        setTeamMembers({ [teamName]: membersRes.data });
      }
    } catch (e) {
      Alert.alert('Hata', 'Takım bilgileri alınamadı.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchAvailableTeams = async () => {
    try {
      const teamsRes = await axios.get(getBackendUrl(API.TEAMS.ALL), {
        headers: { Authorization: user.token },
      });
      console.log('Fetched teams:', teamsRes.data);
      setAvailableTeams(teamsRes.data);
    } catch (e) {
      console.error('Takım listesi alınamadı:', e);
      setAvailableTeams([]);
    }
  };

  useEffect(() => {
    fetchTeamInfo();
    if (user.role === 'admin') {
      fetchAvailableTeams();
    }
  }, [user.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamInfo(false);
  };

  const toggleTeamExpansion = (teamName) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }));
  };

  const openGlobalSettings = async () => {
    setSelectedTeam(null);
    setShowTeamDropdown(false);
    try {
      const teamsRes = await axios.get(getBackendUrl(API.TEAMS.ALL), {
        headers: { Authorization: user.token },
      });
      console.log('Teams response:', teamsRes.data);
      
      setAvailableTeams(teamsRes.data);
      if (teamsRes.data.length > 0) {
        const firstTeam = teamsRes.data[0];
        console.log('Setting first team as selected:', firstTeam);
        setSelectedTeam(firstTeam.name);
        setDailyLeaveLimit(firstTeam.max_leave_count.toString());
      }
    } catch (e) {
      console.error('Takım listesi alınamadı:', e);
    }
    setShowSettingsModal(true);
  };

  const onTeamChange = (teamName) => {
    console.log('onTeamChange called with:', teamName);
    console.log('Available teams:', availableTeams);
    
    setSelectedTeam(teamName);
    const team = availableTeams.find(t => t.name === teamName);
    console.log('Found team:', team);
    
    if (team) {
      setDailyLeaveLimit(team.max_leave_count.toString());
    }
    setShowTeamDropdown(false);
  };

  const saveTeamSettings = async () => {
    try {
      const limit = parseInt(dailyLeaveLimit);
      if (isNaN(limit) || limit < 1 || limit > 10) {
        Alert.alert('Hata', 'Günlük izin limiti 1-10 arasında olmalıdır.');
        return;
      }

      console.log('Saving team settings:', { selectedTeam, limit, availableTeams });

      if (selectedTeam) {
        const teamId = availableTeams.find(team => team.name === selectedTeam)?.id;
        console.log('Found team ID:', teamId, 'for team name:', selectedTeam);
        
        if (teamId) {
          const requestData = {
            team_id: teamId,
            max_leave_count: limit
          };
          console.log('Sending request:', requestData);
          
          const response = await axios.post(getBackendUrl(API.TEAMS.UPDATE_TEAM_LEAVE_LIMIT), requestData, {
            headers: { Authorization: user.token },
          });
          
          console.log('Response received:', response.data);
          
          Alert.alert('Başarılı', `${selectedTeam} takımının günlük izin limiti güncellendi.`);
          setShowSettingsModal(false);
        } else {
          console.error('Team ID not found for team name:', selectedTeam);
          Alert.alert('Hata', 'Takım ID bulunamadı.');
        }
      }
    } catch (e) {
      console.error('Ayar kaydedilemedi:', e);
      console.error('Error response:', e.response?.data);
      Alert.alert('Hata', 'Ayar kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const changeMemberTeam = async (memberId, newTeamId) => {
    try {
      console.log('Changing member team:', { memberId, newTeamId });
      
      const requestData = {
        member_id: memberId,
        new_team_id: newTeamId
      };
      console.log('Sending request:', requestData);
      
      const response = await axios.post(getBackendUrl(API.TEAMS.CHANGE_MEMBER_TEAM), requestData, {
        headers: { Authorization: user.token },
      });

      console.log('Response received:', response.data);

      Alert.alert('Başarılı', response.data.message);
      fetchTeamInfo(false);
    } catch (e) {
      console.error('Ekip değişikliği yapılamadı:', e);
      console.error('Error response:', e.response?.data);
      Alert.alert('Hata', 'Ekip değişikliği yapılamadı. Lütfen tekrar deneyin.');
    }
  };

  const openTeamChangeModal = (member) => {
    if (!availableTeams || availableTeams.length === 0) {
      Alert.alert('Hata', 'Takım listesi yüklenemedi. Lütfen tekrar deneyin.');
      return;
    }

    // Mevcut ekip hariç diğer tüm ekipleri filtrele
    const availableTeamsForMember = availableTeams.filter(team => team.name !== member.team_name);
    
    if (availableTeamsForMember.length === 0) {
      Alert.alert('Bilgi', 'Bu personeli başka bir ekibe atayamazsınız çünkü başka ekip yok.');
      return;
    }

    // Modal state'lerini ayarla
    setSelectedTeam(null);
    setShowTeamDropdown(false);
    setShowTeamChangeDropdown(false);
    setShowTeamChangeModal(true);
    setSelectedMember(member);
  };

  const renderTeamSection = (teamName, members) => {
    const isExpanded = expandedTeams[teamName];
    
    return (
      <View style={styles.teamContainer}>
        <TouchableOpacity 
          style={styles.expandableHeader}
          onPress={() => toggleTeamExpansion(teamName)}
          activeOpacity={0.7}
        >
          <View style={styles.teamHeaderContent}>
            <View style={styles.teamIconContainer}>
              <MaterialIcons name="people" size={20} color="#1976d2" />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{teamName}</Text>
              <Text style={styles.teamMemberCount}>{members.length} üye</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#666"
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandableContent}>
            <View style={styles.memberList}>
              {members.map((member, index) => (
                <View key={member.id} style={[
                  styles.memberItem,
                  index === members.length - 1 && { borderBottomWidth: 0 }
                ]}>
                  <View style={styles.memberAvatar}>
                    <MaterialIcons name="person" size={16} color="#bdbdbd" />
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>
                      {member.first_name || ''} {member.last_name || ''}
                    </Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.memberActions}>
                    <View style={styles.leaveInfo}>
                      <Text style={styles.leaveDaysNumber}>
                        {member.remaining_leave_days || 0} kalan
                      </Text>
                      <Text style={styles.leaveDaysText}>
                        izin günü
                      </Text>
                    </View>
                    {user.role === 'admin' && (
                      <TouchableOpacity 
                        style={styles.changeTeamButton}
                        onPress={() => openTeamChangeModal(member)}
                      >
                        <MaterialIcons name="swap-horiz" size={16} color="#1976d2" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.topBg}>
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <Text style={styles.headerSubtitle}>
                {user.role === 'admin' ? 'Tüm Personeller' : `${Object.values(teamMembers).flat().length} üye`}
              </Text>
              {user.role === 'admin' && (
                <TouchableOpacity 
                  style={styles.globalSettingsButton}
                  onPress={openGlobalSettings}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="settings" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.whiteSection}>
          <View style={styles.leavesSection}>
            {Object.entries(teamMembers).map(([teamName, members]) => 
              <View key={teamName}>
                {renderTeamSection(teamName, members)}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Ekip Ayarları Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowSettingsModal(false);
          setShowTeamDropdown(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => {
            setShowTeamDropdown(false);
          }}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Takım İzin Ayarları
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowTeamDropdown(false);
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Takım Seç</Text>
                {availableTeams && availableTeams.length > 0 ? (
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowTeamDropdown(!showTeamDropdown)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {selectedTeam || 'Takım seçin'}
                      </Text>
                      <MaterialIcons 
                        name={showTeamDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    
                    {showTeamDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableTeams.map((team, index) => (
                          <TouchableOpacity
                            key={team.id}
                            style={[
                              styles.dropdownOption,
                              index === availableTeams.length - 1 && styles.dropdownOptionLast
                            ]}
                            onPress={() => {
                              console.log('Dropdown option pressed:', team.name);
                              onTeamChange(team.name);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>
                              {team.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noTeamsText}>Takım bulunamadı</Text>
                )}
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Günlük İzin Limiti</Text>
                <TextInput
                  style={styles.settingInput}
                  value={dailyLeaveLimit}
                  onChangeText={setDailyLeaveLimit}
                  placeholder="2"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.settingHint}>kişi (1-10)</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveTeamSettings}
                disabled={!selectedTeam || !availableTeams || availableTeams.length === 0}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Ekip Değiştirme Modal */}
      <Modal
        visible={showTeamChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowTeamChangeModal(false);
          setShowTeamChangeDropdown(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => {
            setShowTeamChangeDropdown(false);
          }}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Ekip Değiştir
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowTeamChangeModal(false);
                  setShowTeamChangeDropdown(false);
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {selectedMember && (
                <View style={styles.memberInfo}>
                  <Text style={styles.memberInfoText}>
                    {selectedMember.first_name} {selectedMember.last_name} personelini hangi ekibe atamak istiyorsunuz?
                  </Text>
                </View>
              )}
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Yeni Ekip</Text>
                {availableTeams && availableTeams.length > 0 ? (
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowTeamChangeDropdown(!showTeamChangeDropdown)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {selectedTeam || 'Ekip seçin'}
                      </Text>
                      <MaterialIcons 
                        name={showTeamChangeDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    
                    {showTeamChangeDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableTeams
                          .filter(team => team.name !== (selectedMember?.team_name || ''))
                          .map((team, index) => (
                            <TouchableOpacity
                              key={team.id}
                              style={[
                                styles.dropdownOption,
                                index === availableTeams.filter(t => t.name !== (selectedMember?.team_name || '')).length - 1 && styles.dropdownOptionLast
                              ]}
                              onPress={() => {
                                console.log('Team change dropdown option pressed:', team.name);
                                setSelectedTeam(team.name);
                                setShowTeamChangeDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>
                                {team.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noTeamsText}>Takım bulunamadı</Text>
                )}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowTeamChangeModal(false);
                    setShowTeamChangeDropdown(false);
                    setSelectedTeam(null);
                    setSelectedMember(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.confirmButton,
                    !selectedTeam && styles.confirmButtonDisabled
                  ]}
                  onPress={() => {
                    if (selectedTeam && selectedMember) {
                      const team = availableTeams.find(t => t.name === selectedTeam);
                      if (team) {
                        changeMemberTeam(selectedMember.id, team.id);
                        setShowTeamChangeModal(false);
                        setShowTeamChangeDropdown(false);
                        setSelectedTeam(null);
                        setSelectedMember(null);
                      }
                    }
                  }}
                  disabled={!selectedTeam}
                >
                  <Text style={styles.confirmButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  topBg: {
    backgroundColor: '#f5f7fa',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 16,
  },
  headerSection: {
    paddingTop: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
    flex: 1,
    paddingTop: 4,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  globalSettingsButton: {
    padding: 0,
  },
  whiteSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    paddingTop: 0,
    flex: 1,
    minHeight: 400,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  leavesSection: {
    paddingHorizontal: 0,
    paddingTop: 24,
  },
  teamContainer: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    alignSelf: 'center',
    width: '88%',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
  },
  teamHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  teamMemberCount: {
    fontSize: 14,
    color: '#888',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandableContent: {
    paddingTop: 5,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  expandIcon: {
    marginRight: 15,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveInfo: {
    marginRight: 15,
  },
  leaveDaysNumber: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  leaveDaysText: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: 2,
    fontWeight: '500'
  },
  changeTeamButton: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
    marginRight: 10,
  },
  settingHint: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noTeamsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 10,
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 200,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1001,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  memberInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  memberInfoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

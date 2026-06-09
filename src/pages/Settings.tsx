import { useState } from 'react';
import {
  Settings as SettingsIcon,
  MapPin,
  Users,
  List,
  Package,
  Grid3X3,
  Plus,
  Save,
  Trash2,
  Search,
  Phone,
  User,
  Ruler,
  Hash,
  Tag,
  Clock,
  Palette,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_LEVELS, DISEASE_TYPES } from '@/utils/constants';
import { formatKm, genId } from '@/utils/format';
import type { Road, Team, MaterialDict, Grid, DiseaseLevel, DiseaseType } from '@/shared/types';

type TabValue = 'roads' | 'teams' | 'disease-types' | 'materials' | 'grids';

const TAB_CONFIG = [
  { value: 'roads' as const, label: '道路管理', icon: MapPin },
  { value: 'teams' as const, label: '班组管理', icon: Users },
  { value: 'disease-types' as const, label: '病害字典', icon: List },
  { value: 'materials' as const, label: '材料字典', icon: Package },
  { value: 'grids' as const, label: '网格管理', icon: Grid3X3 },
];

interface NewRoadForm {
  name: string;
  lengthKm: string;
  startPoint: string;
  endPoint: string;
  district: string;
}

interface NewTeamForm {
  name: string;
  leader: string;
  phone: string;
  members: string;
}

interface NewMaterialForm {
  name: string;
  unit: string;
  defaultPrice: string;
}

interface NewGridForm {
  code: string;
  name: string;
  manager: string;
}

const initialRoadForm: NewRoadForm = {
  name: '',
  lengthKm: '',
  startPoint: '',
  endPoint: '',
  district: '',
};

const initialTeamForm: NewTeamForm = {
  name: '',
  leader: '',
  phone: '',
  members: '',
};

const initialMaterialForm: NewMaterialForm = {
  name: '',
  unit: '',
  defaultPrice: '',
};

const initialGridForm: NewGridForm = {
  code: '',
  name: '',
  manager: '',
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabValue>('roads');
  const [keyword, setKeyword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    roads,
    teams,
    materials,
    grids,
    diseaseTypes,
    diseaseLevels,
    getRoadName,
    getTeamName,
  } = useDictStore();

  const [roadForm, setRoadForm] = useState<NewRoadForm>(initialRoadForm);
  const [teamForm, setTeamForm] = useState<NewTeamForm>(initialTeamForm);
  const [materialForm, setMaterialForm] = useState<NewMaterialForm>(initialMaterialForm);
  const [gridForm, setGridForm] = useState<NewGridForm>(initialGridForm);

  const handleSelectRoad = (id: string) => {
    setSelectedId(id);
    setIsEditing(true);
    const road = roads.find((r) => r.id === id);
    if (road) {
      setRoadForm({
        name: road.name,
        lengthKm: String(road.lengthKm),
        startPoint: road.startPoint,
        endPoint: road.endPoint,
        district: road.district,
      });
    }
  };

  const handleSelectTeam = (id: string) => {
    setSelectedId(id);
    setIsEditing(true);
    const team = teams.find((t) => t.id === id);
    if (team) {
      setTeamForm({
        name: team.name,
        leader: team.leader,
        phone: team.phone,
        members: team.members.join(', '),
      });
    }
  };

  const handleSelectMaterial = (id: string) => {
    setSelectedId(id);
    setIsEditing(true);
    const mat = materials.find((m) => m.id === id);
    if (mat) {
      setMaterialForm({
        name: mat.name,
        unit: mat.unit,
        defaultPrice: String(mat.defaultPrice),
      });
    }
  };

  const handleSelectGrid = (id: string) => {
    setSelectedId(id);
    setIsEditing(true);
    const grid = grids.find((g) => g.id === id);
    if (grid) {
      setGridForm({
        code: grid.code,
        name: grid.name,
        manager: grid.manager,
      });
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setIsEditing(true);
    setRoadForm(initialRoadForm);
    setTeamForm(initialTeamForm);
    setMaterialForm(initialMaterialForm);
    setGridForm(initialGridForm);
  };

  const handleCancel = () => {
    setSelectedId(null);
    setIsEditing(false);
    setRoadForm(initialRoadForm);
    setTeamForm(initialTeamForm);
    setMaterialForm(initialMaterialForm);
    setGridForm(initialGridForm);
  };

  const handleSave = () => {
    const { setState } = useDictStore;

    switch (activeTab) {
      case 'roads': {
        if (!roadForm.name.trim()) return;
        const newRoad: Road = {
          id: selectedId || genId('road'),
          name: roadForm.name,
          lengthKm: parseFloat(roadForm.lengthKm) || 0,
          startPoint: roadForm.startPoint,
          endPoint: roadForm.endPoint,
          district: roadForm.district,
        };
        setState((s) => ({
          roads: selectedId
            ? s.roads.map((r) => (r.id === selectedId ? newRoad : r))
            : [newRoad, ...s.roads],
        }));
        break;
      }
      case 'teams': {
        if (!teamForm.name.trim()) return;
        const newTeam: Team = {
          id: selectedId || genId('team'),
          name: teamForm.name,
          leader: teamForm.leader,
          phone: teamForm.phone,
          members: teamForm.members.split(',').map((m) => m.trim()).filter(Boolean),
          workLoad: 0,
        };
        setState((s) => ({
          teams: selectedId
            ? s.teams.map((t) => (t.id === selectedId ? newTeam : t))
            : [newTeam, ...s.teams],
        }));
        break;
      }
      case 'materials': {
        if (!materialForm.name.trim()) return;
        const newMat: MaterialDict = {
          id: selectedId || genId('mat'),
          name: materialForm.name,
          unit: materialForm.unit,
          defaultPrice: parseFloat(materialForm.defaultPrice) || 0,
        };
        setState((s) => ({
          materials: selectedId
            ? s.materials.map((m) => (m.id === selectedId ? newMat : m))
            : [newMat, ...s.materials],
        }));
        break;
      }
      case 'grids': {
        if (!gridForm.name.trim()) return;
        const newGrid: Grid = {
          id: selectedId || genId('grid'),
          code: gridForm.code,
          name: gridForm.name,
          manager: gridForm.manager,
        };
        setState((s) => ({
          grids: selectedId
            ? s.grids.map((g) => (g.id === selectedId ? newGrid : g))
            : [newGrid, ...s.grids],
        }));
        break;
      }
    }

    setIsEditing(false);
    setSelectedId(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    const { setState } = useDictStore;

    switch (activeTab) {
      case 'roads':
        setState((s) => ({ roads: s.roads.filter((r) => r.id !== selectedId) }));
        break;
      case 'teams':
        setState((s) => ({ teams: s.teams.filter((t) => t.id !== selectedId) }));
        break;
      case 'materials':
        setState((s) => ({ materials: s.materials.filter((m) => m.id !== selectedId) }));
        break;
      case 'grids':
        setState((s) => ({ grids: s.grids.filter((g) => g.id !== selectedId) }));
        break;
    }

    setSelectedId(null);
    setIsEditing(false);
  };

  const filteredRoads = roads.filter((r) =>
    keyword ? r.name.toLowerCase().includes(keyword.toLowerCase()) : true
  );
  const filteredTeams = teams.filter((t) =>
    keyword ? t.name.toLowerCase().includes(keyword.toLowerCase()) : true
  );
  const filteredMaterials = materials.filter((m) =>
    keyword ? m.name.toLowerCase().includes(keyword.toLowerCase()) : true
  );
  const filteredGrids = grids.filter((g) =>
    keyword ? g.name.toLowerCase().includes(keyword.toLowerCase()) : true
  );
  const filteredTypes = diseaseTypes.filter((t) =>
    keyword ? t.name.toLowerCase().includes(keyword.toLowerCase()) : true
  );

  return (
    <PageContainer
      title="设置"
      subtitle="系统基础数据配置和字典管理"
    >
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabValue); setSelectedId(null); setIsEditing(false); }}>
          <TabsList className="mb-6">
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4 mr-1.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="roads" className="mt-0 h-full">
              <DictionarySection<Road>
                title="道路管理"
                description="管理管辖范围内的道路基础信息"
                list={filteredRoads}
                selectedId={selectedId}
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSelect={handleSelectRoad}
                isEditing={isEditing}
                onNew={handleNew}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={handleDelete}
                renderItem={(item) => (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">{item.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        全长 {formatKm(item.lengthKm)} · {item.district || '未设置辖区'}
                      </div>
                    </div>
                  </div>
                )}
                renderForm={() => (
                  <div className="space-y-4">
                    <Input
                      label="道路名称"
                      required
                      value={roadForm.name}
                      onChange={(e) => setRoadForm({ ...roadForm, name: e.target.value })}
                      placeholder="如：G104国道"
                      leftIcon={MapPin}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="全长(km)"
                        required
                        type="number"
                        value={roadForm.lengthKm}
                        onChange={(e) => setRoadForm({ ...roadForm, lengthKm: e.target.value })}
                        placeholder="0.00"
                        leftIcon={Ruler}
                      />
                      <Input
                        label="所属辖区"
                        value={roadForm.district}
                        onChange={(e) => setRoadForm({ ...roadForm, district: e.target.value })}
                        placeholder="如：海淀区"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="起点"
                        value={roadForm.startPoint}
                        onChange={(e) => setRoadForm({ ...roadForm, startPoint: e.target.value })}
                        placeholder="起点位置描述"
                      />
                      <Input
                        label="终点"
                        value={roadForm.endPoint}
                        onChange={(e) => setRoadForm({ ...roadForm, endPoint: e.target.value })}
                        placeholder="终点位置描述"
                      />
                    </div>
                  </div>
                )}
                searchPlaceholder="搜索道路名称..."
              />
            </TabsContent>

            <TabsContent value="teams" className="mt-0 h-full">
              <DictionarySection<Team>
                title="班组管理"
                description="管理维修班组及人员信息"
                list={filteredTeams}
                selectedId={selectedId}
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSelect={handleSelectTeam}
                isEditing={isEditing}
                onNew={handleNew}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={handleDelete}
                renderItem={(item) => (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-800 truncate">{item.name}</span>
                        <Badge variant="info" size="sm">
                          {item.members.length}人
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        班长：{item.leader || '未设置'} · {item.phone || '无联系电话'}
                      </div>
                    </div>
                  </div>
                )}
                renderForm={() => (
                  <div className="space-y-4">
                    <Input
                      label="班组名称"
                      required
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="如：第一维修班组"
                      leftIcon={Users}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="班长"
                        required
                        value={teamForm.leader}
                        onChange={(e) => setTeamForm({ ...teamForm, leader: e.target.value })}
                        placeholder="班长姓名"
                        leftIcon={User}
                      />
                      <Input
                        label="联系电话"
                        value={teamForm.phone}
                        onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })}
                        placeholder="手机号码"
                        leftIcon={Phone}
                      />
                    </div>
                    <Input
                      label="成员名单"
                      value={teamForm.members}
                      onChange={(e) => setTeamForm({ ...teamForm, members: e.target.value })}
                      placeholder="多个成员用逗号分隔，如：张三, 李四, 王五"
                      hint="班组成员姓名，用英文或中文逗号分隔"
                    />
                  </div>
                )}
                searchPlaceholder="搜索班组名称..."
              />
            </TabsContent>

            <TabsContent value="disease-types" className="mt-0 h-full">
              <div className="h-full bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">病害字典</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">病害类型和等级配置（系统预置）</p>
                    </div>
                    <div className="w-64">
                      <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="搜索类型名称..."
                        leftIcon={Search}
                        showClear
                        onClear={() => setKeyword('')}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 h-[calc(100%-80px)] overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary-600" />
                      病害类型
                      <Badge variant="neutral" size="sm">{diseaseTypes.length}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {filteredTypes.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-neutral-400">暂无匹配数据</p>
                        </div>
                      ) : (
                        filteredTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: type.color + '20', color: type.color }}
                            >
                              <Hash className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-800">{type.name}</span>
                                <code className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                  {type.id}
                                </code>
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                颜色标识：
                                <span
                                  className="inline-block w-3 h-3 rounded ml-1 align-middle"
                                  style={{ backgroundColor: type.color }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-danger-500" />
                      病害等级
                      <Badge variant="neutral" size="sm">{diseaseLevels.length}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {diseaseLevels.map((level) => (
                        <div
                          key={level.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: level.color + '20', color: level.color }}
                          >
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-800">{level.name}</span>
                              <Badge
                                variant={
                                  level.id === 'critical' ? 'danger' :
                                  level.id === 'severe' ? 'warning' :
                                  level.id === 'moderate' ? 'info' : 'success'
                                }
                                size="sm"
                              >
                                优先级 {level.priority}
                              </Badge>
                              <code className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                {level.id}
                              </code>
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              处置时限：{level.deadlineHours} 小时内
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="mt-0 h-full">
              <DictionarySection<MaterialDict>
                title="材料字典"
                description="管理维修材料及单价配置"
                list={filteredMaterials}
                selectedId={selectedId}
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSelect={handleSelectMaterial}
                isEditing={isEditing}
                onNew={handleNew}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={handleDelete}
                renderItem={(item) => (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">{item.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        单位：{item.unit} · 单价 ¥{item.defaultPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
                renderForm={() => (
                  <div className="space-y-4">
                    <Input
                      label="材料名称"
                      required
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                      placeholder="如：沥青混合料"
                      leftIcon={Package}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="计量单位"
                        required
                        value={materialForm.unit}
                        onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                        placeholder="如：吨、平方米、千克"
                      />
                      <Input
                        label="默认单价(元)"
                        required
                        type="number"
                        value={materialForm.defaultPrice}
                        onChange={(e) => setMaterialForm({ ...materialForm, defaultPrice: e.target.value })}
                        placeholder="0.00"
                        leftIcon={ArrowRightLeft}
                      />
                    </div>
                  </div>
                )}
                searchPlaceholder="搜索材料名称..."
              />
            </TabsContent>

            <TabsContent value="grids" className="mt-0 h-full">
              <DictionarySection<Grid>
                title="网格管理"
                description="管理责任网格划分和负责人"
                list={filteredGrids}
                selectedId={selectedId}
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSelect={handleSelectGrid}
                isEditing={isEditing}
                onNew={handleNew}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={handleDelete}
                renderItem={(item) => (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-medium">
                          {item.code}
                        </code>
                        <span className="text-sm font-medium text-neutral-800 truncate">{item.name}</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        负责人：{item.manager || '未设置'}
                      </div>
                    </div>
                  </div>
                )}
                renderForm={() => (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="网格编码"
                        required
                        value={gridForm.code}
                        onChange={(e) => setGridForm({ ...gridForm, code: e.target.value })}
                        placeholder="如：G01、A-02"
                        leftIcon={Hash}
                      />
                      <Input
                        label="网格名称"
                        required
                        value={gridForm.name}
                        onChange={(e) => setGridForm({ ...gridForm, name: e.target.value })}
                        placeholder="如：中心区东片"
                        leftIcon={Grid3X3}
                      />
                    </div>
                    <Input
                      label="网格负责人"
                      value={gridForm.manager}
                      onChange={(e) => setGridForm({ ...gridForm, manager: e.target.value })}
                      placeholder="负责人姓名"
                      leftIcon={User}
                    />
                  </div>
                )}
                searchPlaceholder="搜索网格名称..."
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
}

interface DictionarySectionProps<T> {
  title: string;
  description: string;
  list: T[];
  selectedId: string | null;
  keyword: string;
  onKeywordChange: (v: string) => void;
  onSelect: (id: string) => void;
  isEditing: boolean;
  onNew: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  renderItem: (item: T) => React.ReactNode;
  renderForm: () => React.ReactNode;
  searchPlaceholder?: string;
}

function DictionarySection<T extends { id: string }>({
  title,
  description,
  list,
  selectedId,
  keyword,
  onKeywordChange,
  onSelect,
  isEditing,
  onNew,
  onSave,
  onCancel,
  onDelete,
  renderItem,
  renderForm,
  searchPlaceholder,
}: DictionarySectionProps<T>) {
  return (
    <div className="h-full bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder={searchPlaceholder || '搜索...'}
              leftIcon={Search}
              showClear
              onClear={() => onKeywordChange('')}
              size="sm"
              className="w-56"
            />
            <Button size="sm" icon={Plus} onClick={onNew}>
              新增
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="w-[380px] flex-shrink-0 border-r border-neutral-100 overflow-y-auto">
          {list.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-neutral-600">暂无数据</p>
              <p className="text-xs text-neutral-400 mt-1">点击右上角新增按钮添加</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-50">
              {list.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      'w-full text-left p-4 transition-all relative',
                      'hover:bg-neutral-50',
                      selectedId === item.id && 'bg-primary-50/80'
                    )}
                  >
                    {selectedId === item.id && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
                    )}
                    {renderItem(item)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {isEditing ? (
            <>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="max-w-xl">
                  <div className="mb-6 pb-4 border-b border-neutral-100">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {selectedId ? '编辑' : '新增'}详情
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {selectedId ? '修改选中项的详细信息' : '填写新增项的基础信息'}
                    </p>
                  </div>
                  {renderForm()}
                </div>
              </div>
              <div className="p-4 border-t border-neutral-100 flex items-center justify-end gap-3 bg-neutral-50/50 flex-shrink-0">
                {selectedId && (
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                    onClick={onDelete}
                  >
                    删除
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="secondary" onClick={onCancel}>
                  取消
                </Button>
                <Button icon={Save} onClick={handleSaveWrapper(onSave)}>
                  保存
                </Button>
              </div>
            </>
          ) : selectedId ? (
            <div className="p-6 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mx-auto mb-4 flex items-center justify-center">
                  <SettingsIcon className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">已选中记录</h3>
                <p className="text-xs text-neutral-500 mb-4">
                  点击下方按钮编辑该项信息
                </p>
                <Button size="sm" icon={Plus} onClick={onNew}>
                  编辑此记录
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mx-auto mb-4 flex items-center justify-center">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">开始使用</h3>
                <p className="text-xs text-neutral-500 mb-4">
                  从左侧选择记录查看，或点击新增按钮添加新数据
                </p>
                <Button size="sm" icon={Plus} onClick={onNew}>
                  新增记录
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function handleSaveWrapper(fn: () => void) {
  return fn;
}

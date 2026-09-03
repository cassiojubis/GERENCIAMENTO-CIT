  const STORAGE_KEY = 'CIT_CANVA_RECORDS';
  let bookings = [];
  let allRecords = [];
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null;
    
    const defaultConfig = {
      site_title: 'Sistema de Agendamento CIT',
      institution_name: 'Instituto Federal de Rondônia',
      contact_email: 'cit@ifro.edu.br',
      contact_phone: '(69) 3211-0000'
    };

    const timeSlots = [
      '08:00 - 10:00',
      '10:00 - 12:00',
      '14:00 - 16:00',
      '16:00 - 18:00',
      '18:00 - 20:00',
      '20:00 - 22:00'
    ];

    function applyConfig(config) {
      const institutionName = config.institution_name || defaultConfig.institution_name;
      const contactEmail = config.contact_email || defaultConfig.contact_email;
      const contactPhone = config.contact_phone || defaultConfig.contact_phone;

      document.getElementById('nav-institution').textContent = institutionName;
      document.getElementById('footer-institution').textContent = institutionName;
      document.getElementById('contact-email-display').textContent = contactEmail;
      document.getElementById('contact-phone-display').textContent = contactPhone;
    }

    function refreshRecords() {
      allRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      bookings = allRecords.filter(item => !item.record_type || item.record_type === 'booking');
    }

    function saveRecords() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
      refreshRecords();
      updateUI();
      renderAdminPanels();
    }

    async function localCreate(record) {
      allRecords.push({ ...record, __backendId: record.__backendId || `local-${Date.now()}-${Math.random().toString(36).slice(2)}` });
      saveRecords();
      return { isOk: true };
    }

    async function localUpdate(record) {
      const index = allRecords.findIndex(item => item.__backendId === record.__backendId);
      if (index < 0) return { isOk: false };
      allRecords[index] = record;
      saveRecords();
      return { isOk: true };
    }

    async function localDelete(record) {
      allRecords = allRecords.filter(item => item.__backendId !== record.__backendId);
      saveRecords();
      return { isOk: true };
    }

    function updateUI() {
      updateStats();
      updateBookingsList();
      updatePendingRequests();
      updateReports();
      updateActivityLog();
      renderCalendar();
      if (selectedDate) {
        updateTimeSlots(selectedDate);
      }
    }

    function updateStats() {
      const approved = bookings.filter(b => b.status === 'approved').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const total = timeSlots.length * 30;
      const available = total - approved - pending;

      document.getElementById('stat-available').textContent = Math.max(0, available);
      document.getElementById('stat-occupied').textContent = approved;
      document.getElementById('stat-pending').textContent = pending;
    }

    function updateBookingsList() {
      const container = document.getElementById('bookings-list');
      const countEl = document.getElementById('booking-count');
      
      countEl.textContent = `${bookings.length} agendamento${bookings.length !== 1 ? 's' : ''}`;
      
      if (bookings.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4 font-medium">Nenhum agendamento registrado ainda.</p>';
        return;
      }

      const sortedBookings = [...bookings].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      container.innerHTML = sortedBookings.slice(0, 10).map(booking => {
        const statusClass = booking.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                          booking.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
        const statusText = booking.status === 'approved' ? 'Aprovado' : 
                          booking.status === 'pending' ? 'Pendente' : 'Cancelado';
        
        return `
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full ${booking.status === 'approved' ? 'bg-emerald-500' : booking.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}"></div>
              <div>
                <div class="font-bold text-gray-800">${booking.responsible}</div>
                <div class="text-sm text-gray-600 font-medium">${formatDate(booking.date)} • ${booking.time_slot} • ${booking.purpose}</div>
                ${booking.equipment_quantities ? `<div class="text-xs text-gray-500 mt-1">Equipamentos: ${booking.equipment_quantities}${booking.equipment_requests ? ` (${booking.equipment_requests})` : ''}</div>` : ''}
                ${booking.rejection_reason ? `<div class="text-xs text-red-700 mt-1 font-semibold">Motivo da recusa: ${booking.rejection_reason}</div>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 text-xs font-bold rounded-full ${statusClass}">${statusText}</span>
              <button onclick="deleteBooking('${booking.__backendId}')" class="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Excluir">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function updatePendingRequests() {
      const container = document.getElementById('pending-requests');
      const pendingBookings = bookings.filter(b => b.status === 'pending');
      
      if (pendingBookings.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-sm text-center py-4 font-medium">Nenhuma solicitação pendente.</p>';
        return;
      }

      container.innerHTML = pendingBookings.map(booking => `
        <div class="bg-white rounded-lg p-4 border-2 border-green-200">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-bold text-gray-800">${booking.responsible}</div>
              <div class="text-sm text-gray-600 font-medium">${formatDate(booking.date)} • ${booking.time_slot}</div>
            </div>
            <span class="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">${booking.purpose}</span>
          </div>
          ${booking.description ? `<p class="text-sm text-gray-600 mb-3 font-medium">${booking.description}</p>` : ''}
          <div class="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800 font-semibold">
            Equipamentos necessários: ${booking.equipment_quantities || '0'}${booking.equipment_requests ? ` — ${booking.equipment_requests}` : ''}
          </div>
          <div class="flex gap-2">
            <button onclick="approveBooking('${booking.__backendId}')" class="flex-1 px-3 py-2 gradient-ifro text-white text-sm rounded-lg hover:shadow-lg transition-all font-bold">
              Aprovar
            </button>
            <button onclick="openRejectionModal('${booking.__backendId}')" class="flex-1 px-3 py-2 border-2 border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors font-bold">
              Recusar
            </button>
          </div>
        </div>
      `).join('');
    }

    function updateReports() {
      const total = bookings.length;
      const approved = bookings.filter(b => b.status === 'approved').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const rate = total > 0 ? Math.round((approved / (timeSlots.length * 30)) * 100) : 0;

      document.getElementById('report-total').textContent = total;
      document.getElementById('report-approved').textContent = approved;
      document.getElementById('report-pending').textContent = pending;
      document.getElementById('report-rate').textContent = Math.min(rate, 100) + '%';

      const purposes = ['Aula', 'Projeto', 'Reunião', 'Treinamento'];
      const maxCount = Math.max(...purposes.map(p => bookings.filter(b => b.purpose === p).length), 1);

      purposes.forEach(purpose => {
        const count = bookings.filter(b => b.purpose === purpose).length;
        const barId = 'bar-' + purpose.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const countId = 'count-' + purpose.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        const barEl = document.getElementById(barId);
        const countEl = document.getElementById(countId);
        
        if (barEl) barEl.style.width = (count / maxCount * 100) + '%';
        if (countEl) countEl.textContent = count;
      });

      const othersCount = bookings.filter(b => !purposes.includes(b.purpose)).length;
      const barOutros = document.getElementById('bar-outros');
      const countOutros = document.getElementById('count-outros');
      if (barOutros) barOutros.style.width = (othersCount / maxCount * 100) + '%';
      if (countOutros) countOutros.textContent = othersCount;
    }

    function updateActivityLog() {
      const container = document.getElementById('activity-log');
      const recentBookings = [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      
      if (recentBookings.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-sm text-center py-4 font-medium">Nenhuma atividade registrada.</p>';
        return;
      }

      container.innerHTML = recentBookings.map(booking => {
        const action = booking.status === 'approved' ? 'aprovado' : 'solicitado';
        return `
          <div class="flex items-center gap-3 text-sm">
            <div class="w-2 h-2 rounded-full ${booking.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}"></div>
            <span class="flex-1 text-gray-600 font-medium">
              <strong class="text-gray-800">${booking.responsible}</strong> ${action} agendamento para ${formatDate(booking.date)}
            </span>
            <span class="text-gray-400 text-xs font-medium">${getRelativeTime(booking.created_at)}</span>
          </div>
        `;
      }).join('');
    }

    function renderCalendar() {
      const container = document.getElementById('calendar-days');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      document.getElementById('calendar-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
      
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const today = new Date();
      
      let html = '';
      
      for (let i = 0; i < firstDay; i++) {
        html += '<div class="p-2"></div>';
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayBookings = bookings.filter(b => b.date === dateStr);
        const hasApproved = dayBookings.some(b => b.status === 'approved');
        const hasPending = dayBookings.some(b => b.status === 'pending');
        const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const isSelected = selectedDate === dateStr;
        const isPast = new Date(dateStr) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        let statusDot = '';
        if (hasApproved && hasPending) {
          statusDot = '<div class="flex gap-0.5 justify-center mt-1"><div class="w-2 h-2 bg-red-500 rounded-full"></div><div class="w-2 h-2 bg-amber-500 rounded-full"></div></div>';
        } else if (hasApproved) {
          statusDot = '<div class="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>';
        } else if (hasPending) {
          statusDot = '<div class="w-2 h-2 bg-amber-500 rounded-full mx-auto mt-1"></div>';
        } else if (!isPast) {
          statusDot = '<div class="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-1"></div>';
        }
        
        const professorNames = dayBookings.map(b => b.responsible).filter(Boolean).slice(0, 2).join(', ');
        html += `
          <button onclick="selectDate('${dateStr}')" title="${professorNames ? 'Agendado por: ' + professorNames : 'Sem agendamentos'}" class="p-3 min-h-[88px] rounded-lg transition-all font-bold border-2 text-left ${isSelected ? 'gradient-ifro text-white border-green-600' : isToday ? 'bg-green-100 text-green-800 border-green-300' : isPast ? 'text-gray-300 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}" ${isPast ? 'disabled' : ''}>
            <div class="text-sm text-center">${day}</div>
            ${statusDot}
            <div class="text-[10px] leading-tight mt-2 text-center ${isSelected ? 'text-white' : 'text-gray-500'}">${professorNames || 'Livre'}</div>
          </button>
        `;
      }
      
      container.innerHTML = html;
    }

    function changeMonth(delta) {
      currentMonth += delta;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    }

    function selectDate(dateStr) {
      selectedDate = dateStr;
      document.getElementById('selected-date').textContent = formatDate(dateStr);
      updateTimeSlots(dateStr);
      renderCalendar();
    }

    function updateTimeSlots(dateStr) {
      const container = document.getElementById('time-slots');
      const dayBookings = bookings.filter(b => b.date === dateStr);
      
      container.innerHTML = timeSlots.map(slot => {
        const booking = dayBookings.find(b => b.time_slot === slot);
        let statusClass, statusText, bgClass;
        
        if (booking) {
          if (booking.status === 'approved') {
            statusClass = 'bg-red-500';
            statusText = `${booking.purpose} - ${booking.responsible}`;
            bgClass = 'bg-red-50 border-red-200';
          } else {
            statusClass = 'bg-amber-500';
            statusText = `Aguardando aprovação - ${booking.responsible}`;
            bgClass = 'bg-amber-50 border-amber-200';
          }
        } else {
          statusClass = 'bg-emerald-500';
          statusText = 'Disponível';
          bgClass = 'bg-white border-gray-200 hover:border-green-500 cursor-pointer hover:bg-green-50';
        }
        
        return `
          <div onclick="${!booking ? `openBookingModalWithDate('${dateStr}', '${slot}')` : ''}" class="p-3 rounded-lg border-2 ${bgClass} transition-all">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full ${statusClass}"></div>
              <span class="font-bold text-gray-800">${slot}</span>
            </div>
            <div class="text-xs text-gray-600 mt-1 font-medium">${statusText}</div>
            ${booking ? `<button onclick="showBookingDetails('${booking.__backendId}'); event.stopPropagation();" class="mt-2 text-xs font-bold text-green-700 underline">Ver detalhes</button>` : ''}
          </div>
        `;
      }).join('');
    }

    function showBookingDetails(backendId) {
      const booking = bookings.find(item => item.__backendId === backendId);
      if (!booking) return;
      showToast(`${booking.responsible} • ${formatDate(booking.date)} • ${booking.time_slot} • ${booking.purpose}${booking.equipment_requests ? ' • ' + booking.equipment_requests : ''}`);
    }

    function openBookingModal() {
      const role = document.getElementById('access-role')?.value || 'user';
      const personName = document.getElementById('current-user-name')?.value.trim().toLowerCase() || '';
      const individualPermission = allRecords.find(item => item.record_type === 'permission' && item.user_name?.toLowerCase() === personName && item.user_role === role);
      const allowed = role === 'manager' || Boolean(individualPermission?.access_allowed);
      if (!allowed) {
        showToast('O gestor ainda não liberou agendamentos para este perfil.');
        return;
      }
      document.getElementById('booking-modal').classList.remove('hidden');
      document.getElementById('booking-form').reset();
      document.getElementById('booking-suggestion').classList.add('hidden');
    }

    function openBookingModalWithDate(date, slot) {
      openBookingModal();
      document.getElementById('booking-date').value = date;
      document.getElementById('booking-time').value = slot;
    }

    function closeBookingModal() {
      document.getElementById('booking-modal').classList.add('hidden');
    }

    async function handleBookingSubmit(event) {
      event.preventDefault();
      
      if (bookings.length >= 999) {
        showToast('Limite de 999 agendamentos atingido.');
        return;
      }
      
      const date = document.getElementById('booking-date').value;
      const timeSlot = document.getElementById('booking-time').value;
      const responsible = document.getElementById('booking-responsible').value;
      const purpose = document.getElementById('booking-purpose').value;
      const description = document.getElementById('booking-description').value;
      const startTime = document.getElementById('booking-start').value;
      const endTime = document.getElementById('booking-end').value;
      const participants = Number(document.getElementById('booking-participants').value);
      const equipmentRequests = [...document.querySelectorAll('.equipment-choice:checked')].map(input => input.value).join(', ');
      const equipmentQuantity = Number(document.getElementById('booking-equipment-quantity').value);
      if (startTime >= endTime) { showToast('O horário de término deve ser posterior ao início.'); return; }
      
      const conflict = bookings.find(b => b.date === date && b.time_slot === timeSlot && b.status === 'approved');
      
      if (conflict) {
        const suggestion = findAlternativeSlot(date, timeSlot);
        document.getElementById('suggestion-text').textContent = suggestion;
        document.getElementById('booking-suggestion').classList.remove('hidden');
        return;
      }
      
      const submitBtn = document.getElementById('submit-booking-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';
      
      try {
        const result = await localCreate({
          record_type: 'booking',
          date,
          start_time: startTime,
          end_time: endTime,
          time_slot: timeSlot,
          responsible,
          purpose,
          participants,
          description,
          equipment_requests: equipmentRequests,
          equipment_quantities: String(equipmentQuantity),
          rejection_reason: '',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (result.isOk) {
          closeBookingModal();
          showToast('✅ Agendamento solicitado com sucesso!');
        } else {
          showToast('❌ Erro ao criar agendamento.');
        }
      } catch (error) {
        showToast('❌ Erro ao criar agendamento.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Agendar';
      }
    }

    function findAlternativeSlot(date, requestedSlot) {
      const requestedIndex = timeSlots.indexOf(requestedSlot);
      const dayBookings = bookings.filter(b => b.date === date && b.status === 'approved');
      const occupiedSlots = dayBookings.map(b => b.time_slot);
      
      for (let i = requestedIndex + 1; i < timeSlots.length; i++) {
        if (!occupiedSlots.includes(timeSlots[i])) {
          return `Horário ${requestedSlot} ocupado. Sugerimos ${timeSlots[i]}.`;
        }
      }
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      return `Horário ${requestedSlot} ocupado. Sugerimos ${requestedSlot} em ${formatDate(nextDayStr)}.`;
    }

    let rejectionBookingId = null;

    function openRejectionModal(backendId) {
      rejectionBookingId = backendId;
      document.getElementById('rejection-reason').value = '';
      document.getElementById('rejection-note').textContent = '';
      document.getElementById('rejection-modal').classList.remove('hidden');
      document.getElementById('rejection-reason').focus();
    }

    function closeRejectionModal() {
      rejectionBookingId = null;
      document.getElementById('rejection-modal').classList.add('hidden');
    }

    async function confirmRejection() {
      const reason = document.getElementById('rejection-reason').value.trim();
      const button = document.getElementById('confirm-rejection-btn');
      if (!reason) {
        document.getElementById('rejection-note').textContent = 'Informe o motivo antes de confirmar a recusa.';
        return;
      }
      const booking = bookings.find(b => b.__backendId === rejectionBookingId);
      if (!booking) return;
      button.disabled = true;
      button.textContent = 'Salvando...';
      const result = await localUpdate({...booking, status:'rejected', rejection_reason:reason, updated_at:new Date().toISOString()});
      button.disabled = false;
      button.textContent = 'Confirmar recusa';
      if (result.isOk) { closeRejectionModal(); showToast('✅ Recusa registrada com justificativa.'); }
      else document.getElementById('rejection-note').textContent = 'Não foi possível salvar. Tente novamente.';
    }

    async function approveBooking(backendId) {
      const booking = bookings.find(b => b.__backendId === backendId);
      if (!booking) return;
      
      const result = await localUpdate({
        ...booking,
        status: 'approved'
      });
      
      if (result.isOk) {
        showToast('✅ Agendamento aprovado!');
      } else {
        showToast('❌ Erro ao aprovar.');
      }
    }

    async function deleteBooking(backendId) {
      const booking = bookings.find(b => b.__backendId === backendId);
      if (!booking) return;
      
      const result = await localDelete(booking);
      
      if (result.isOk) {
        showToast('✅ Agendamento removido!');
      } else {
        showToast('❌ Erro ao remover.');
      }
    }

    async function handleContactSubmit(event) {
      event.preventDefault();
      const button = event.target.querySelector('button[type="submit"]');
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email-input').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      button.disabled = true;
      button.textContent = 'Enviando...';
      const result = await localCreate({record_type:'contact', name, responsible:name, purpose:'Contato', description:message, equipment_requests:email, date:new Date().toISOString().slice(0,10), start_time:'', end_time:'', time_slot:'', participants:0, status:'new', created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
      if (result.isOk) {
        document.getElementById('contact-success').classList.remove('hidden');
        document.getElementById('contact-form').reset();
        setTimeout(() => document.getElementById('contact-success').classList.add('hidden'), 5000);
      } else showToast('Não foi possível enviar a mensagem.');
      button.disabled = false;
      button.textContent = 'Enviar Mensagem';
    }

    function getIndividualPermission(name, role) {
      return allRecords.find(item => item.record_type === 'permission' && item.user_name?.toLowerCase() === name.toLowerCase() && item.user_role === role);
    }

    function refreshIndividualAccess() {
      const role = document.getElementById('access-role')?.value || 'user';
      const name = document.getElementById('current-user-name')?.value.trim() || '';
      const permission = name ? getIndividualPermission(name, role) : null;
      const note = document.getElementById('individual-access-note');
      if (note) note.textContent = !name ? 'Digite um nome para consultar a permissão.' : permission?.access_allowed ? '✅ Acesso liberado para este usuário.' : '🔒 Acesso ainda não liberado pelo gestor.';
      const canRequest = role === 'manager' || Boolean(permission?.access_allowed);
      document.querySelectorAll('button[onclick="openBookingModal()"], a[href="#calendario"]').forEach(btn => { if (btn.closest('#admin') || btn.tagName === 'A') btn.style.display = canRequest ? '' : 'none'; });
    }

    async function saveIndividualPermission() {
      const name = document.getElementById('permission-user-name').value.trim();
      const role = document.getElementById('permission-user-role').value;
      const allowed = document.getElementById('permission-user-allowed').checked;
      if (!name) { showToast('Informe o nome exato do usuário.'); return; }
      const existing = getIndividualPermission(name, role);
      const payload = { record_type:'permission', user_name:name, user_role:role, access_allowed:allowed, created_at:new Date().toISOString(), updated_at:new Date().toISOString(), name, equipment_type:'', category:'', photo_url:'', quantity:0, condition:'', status:'active', date:'', start_time:'', end_time:'', time_slot:'', responsible:'', purpose:'', participants:0, description:'', equipment_requests:'' };
      const result = existing ? await localUpdate({...existing, ...payload}) : await localCreate(payload);
      if (result.isOk) { showToast(`✅ Acesso ${allowed ? 'liberado' : 'bloqueado'} para ${name}.`); document.getElementById('current-user-name').value = name; refreshIndividualAccess(); }
      else showToast('❌ Não foi possível salvar a permissão.');
    }

    function changeAccessRole(role) {
      const note = document.getElementById('access-note');
      const isManager = role === 'manager';
      const permissionControls = document.getElementById('permission-controls');
      if (permissionControls) permissionControls.classList.toggle('hidden', !isManager);
      const currentName = document.getElementById('current-user-name')?.value.trim() || '';
      const individualPermission = currentName ? getIndividualPermission(currentName, role) : null;
      const canRequest = role === 'manager' || Boolean(individualPermission?.access_allowed);
      const reportsSection = document.getElementById('relatorios');
      const reportsLinks = document.querySelectorAll('a[href="#relatorios"]');
      if (note) note.textContent = role === 'user' ? 'O usuário comum pode visualizar a agenda, sem acesso à administração e aos relatórios.' : role === 'server' ? 'O servidor pode consultar a agenda e solicitar agendamentos, sem acesso aos relatórios.' : 'O gestor pode administrar agendamentos, equipamentos, histórico e relatórios.';
      document.querySelectorAll('#admin .admin-tab, #admin .admin-panel, #admin .mt-8 h3, #admin .mt-8 p').forEach(el => { el.style.display = isManager ? '' : 'none'; });
      document.querySelectorAll('#admin .mt-8').forEach(el => { el.style.display = isManager ? '' : 'none'; });
      const quickActions = document.querySelector('#admin .grid.md\\:grid-cols-2');
      if (quickActions) quickActions.style.display = isManager ? '' : 'none';
      if (reportsSection) reportsSection.style.display = isManager ? '' : 'none';
      reportsLinks.forEach(link => { link.style.display = isManager ? '' : 'none'; });
      const bookingButtons = document.querySelectorAll('a[href="#calendario"], button[onclick="openBookingModal()"]');
      bookingButtons.forEach(btn => { if (btn.closest('#admin') || btn.closest('#booking-modal')) btn.style.display = canRequest ? '' : 'none'; });
      if (!isManager) showToast(role === 'user' ? 'Perfil somente para consulta. Relatórios restritos ao gestor.' : 'Perfil de servidor: relatórios restritos ao gestor.');
    }

    function updateRolePermissions() {
      const currentRole = document.getElementById('access-role')?.value || 'user';
      changeAccessRole(currentRole);
      showToast('✅ Permissões atualizadas para a demonstração.');
    }

    function renderHistoryResults() {
      const target = document.getElementById('history-results');
      if (!target) return;
      const month = document.getElementById('history-month')?.value || '';
      const date = document.getElementById('history-date')?.value || '';
      const records = bookings.filter(b => b.status === 'approved' && (!month || b.date.startsWith(month)) && (!date || b.date === date)).sort((a,b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`));
      target.innerHTML = records.length ? records.map(b => `<div class="bg-white p-4 rounded-xl border border-blue-200 mb-3"><div class="font-bold text-gray-800">${formatDate(b.date)} • ${b.start_time}–${b.end_time}</div><div class="text-sm text-gray-600 mt-1"><strong>${b.responsible}</strong> utilizou a sala para ${b.purpose}, com ${b.participants || 0} participantes.</div><div class="text-xs text-gray-500 mt-1">Equipamentos: ${b.equipment_requests || 'Nenhum'}</div></div>`).join('') : '<p class="text-gray-500 text-center py-6">Nenhum registro encontrado para o período selecionado.</p>';
    }

    function filterHistory() { renderHistoryResults(); }
    function clearHistoryFilters() { document.getElementById('history-month').value = ''; document.getElementById('history-date').value = ''; renderHistoryResults(); }

    function showAdminPanel(panel) {
      document.querySelectorAll('.admin-panel').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.admin-tab').forEach(el => {
        el.className = 'admin-tab px-4 py-2 rounded-lg bg-white border-2 border-green-200 text-gray-700 font-bold text-sm';
      });
      document.getElementById(`admin-panel-${panel}`).classList.remove('hidden');
      document.getElementById(`admin-tab-${panel}`).className = 'admin-tab px-4 py-2 rounded-lg bg-green-600 text-white font-bold text-sm';
      renderAdminPanels();
    }

    function renderAdminPanels() {
      const agenda = document.getElementById('admin-panel-agenda');
      const historico = document.getElementById('admin-panel-historico');
      const equipamentos = document.getElementById('admin-panel-equipamentos');
      const sorted = [...bookings].sort((a,b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      agenda.innerHTML = sorted.length ? sorted.map(b => `<div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-green-200 mb-3"><div><strong>${b.responsible}</strong><div class="text-sm text-gray-600">${formatDate(b.date)} • ${b.start_time}–${b.end_time} • ${b.purpose}</div><div class="text-xs text-gray-500">${b.participants || 0} participantes${b.equipment_requests ? ' • ' + b.equipment_requests : ''}</div></div><span class="px-3 py-1 rounded-full text-xs font-bold ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${b.status === 'approved' ? 'Aprovado' : 'Pendente'}</span></div>`).join('') : '<p class="text-gray-500 text-center py-6">Nenhum agendamento cadastrado.</p>';
      historico.innerHTML = `<div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-5"><div class="grid sm:grid-cols-2 gap-3"><div><label for="history-month" class="block text-xs font-bold text-gray-700 mb-1">Filtrar por mês</label><input id="history-month" type="month" onchange="filterHistory()" class="w-full px-3 py-2 rounded-lg border-2 border-blue-200"></div><div><label for="history-date" class="block text-xs font-bold text-gray-700 mb-1">Filtrar por data</label><input id="history-date" type="date" onchange="filterHistory()" class="w-full px-3 py-2 rounded-lg border-2 border-blue-200"></div></div><button onclick="clearHistoryFilters()" class="mt-3 text-sm font-bold text-blue-700 underline">Limpar filtros</button></div><div id="history-results"></div>`;
      renderHistoryResults();
      equipamentos.innerHTML = `<div class="grid sm:grid-cols-2 gap-3 mb-5"><input id="new-equipment-name" aria-label="Nome do equipamento" placeholder="Nome do equipamento" class="px-4 py-3 rounded-lg border-2 border-green-200"><select id="new-equipment-type" aria-label="Tipo do equipamento" class="px-4 py-3 rounded-lg border-2 border-green-200"><option value="Informática">Informática</option><option value="Audiovisual">Audiovisual</option><option value="Mobiliário">Mobiliário</option><option value="Outro">Outro</option></select><input id="new-equipment-category" aria-label="Classificação do equipamento" placeholder="Classificação (ex.: Projeção)" class="px-4 py-3 rounded-lg border-2 border-green-200"><input id="new-equipment-photo" aria-label="Foto do produto" type="url" placeholder="Link da foto (https://...)" class="px-4 py-3 rounded-lg border-2 border-green-200"><input id="new-equipment-quantity" aria-label="Quantidade" type="number" min="1" value="1" class="px-4 py-3 rounded-lg border-2 border-green-200"><select id="new-equipment-condition" aria-label="Situação" class="px-4 py-3 rounded-lg border-2 border-green-200"><option>Disponível</option><option>Indisponível</option><option>Em manutenção</option></select><button onclick="addEquipment()" class="px-5 py-3 rounded-lg bg-green-600 text-white font-bold">Cadastrar equipamento</button></div><div id="equipment-list"></div>`;
      renderEquipmentList();
    }

    function renderEquipmentList() {
      const list = document.getElementById('equipment-list');
      if (!list) return;
      const items = allRecords.filter(b => b.record_type === 'equipment');
      list.innerHTML = items.length ? items.map(e => `<div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-green-200 mb-3"><div class="flex items-center gap-4"><div class="w-16 h-16 rounded-xl overflow-hidden bg-green-50 border border-green-200 flex items-center justify-center">${e.photo_url ? `<img src="${e.photo_url}" alt="Foto de ${e.name}" loading="lazy" class="w-full h-full object-cover" onerror="this.style.display='none';this.parentElement.textContent='📦'">` : '<span class="text-2xl">📦</span>'}</div><div><strong>${e.name}</strong><div class="text-sm text-gray-600">${e.equipment_type || 'Não classificado'} • ${e.category || 'Sem classificação'}</div><div class="text-sm text-gray-600">Quantidade: ${e.quantity}</div></div></div><div class="flex items-center gap-2"><span class="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800">${e.condition}</span><button onclick="showEquipmentDetails('${e.__backendId}')" class="px-3 py-2 rounded-lg border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs">Ver detalhes</button><button onclick="deleteEquipment('${e.__backendId}')" class="px-3 py-2 rounded-lg border-2 border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs">Remover</button></div></div>`).join('') : '<p class="text-gray-500 text-center py-6">Nenhum equipamento cadastrado. Cadastre o primeiro acima.</p>';
    }

    function showEquipmentDetails(backendId) {
      const equipment = allRecords.find(item => item.__backendId === backendId && item.record_type === 'equipment');
      if (!equipment) return;
      showToast(`${equipment.name} • Tipo: ${equipment.equipment_type || 'Não informado'} • Classificação: ${equipment.category || 'Não informada'} • Quantidade: ${equipment.quantity} • Situação: ${equipment.condition}`);
    }

    async function deleteEquipment(backendId) {
      const equipment = allRecords.find(item => item.__backendId === backendId && item.record_type === 'equipment');
      if (!equipment) return;
      const result = await localDelete(equipment);
      if (result.isOk) {
        showToast('✅ Equipamento removido!');
      } else {
        showToast('❌ Não foi possível remover o equipamento.');
      }
    }

    async function addEquipment() {
      const name = document.getElementById('new-equipment-name').value.trim();
      const equipmentType = document.getElementById('new-equipment-type').value;
      const category = document.getElementById('new-equipment-category').value.trim();
      const photoUrl = document.getElementById('new-equipment-photo').value.trim();
      const quantity = Number(document.getElementById('new-equipment-quantity').value);
      const condition = document.getElementById('new-equipment-condition').value;
      if (!name || quantity < 1) { showToast('Informe o nome e uma quantidade válida.'); return; }
      const result = await localCreate({record_type:'equipment', name, equipment_type:equipmentType, category, photo_url:photoUrl, quantity, condition, status:'active', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), date:'', start_time:'', end_time:'', time_slot:'', responsible:'', purpose:'', participants:0, description:'', equipment_requests:''});
      if (result.isOk) { showToast('✅ Equipamento cadastrado!'); renderAdminPanels(); } else showToast('❌ Não foi possível cadastrar.');
    }

    function exportData() {
      const dataStr = JSON.stringify(bookings, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agendamentos-cit-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Dados exportados!');
    }

    function formatDate(dateStr) {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function getRelativeTime(isoString) {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'agora';
      if (diffMins < 60) return `${diffMins}min`;
      if (diffHours < 24) return `${diffHours}h`;
      return `${diffDays}d`;
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-message').textContent = message;
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3000);
    }

    function toggleMobileMenu() {
      document.getElementById('mobile-menu').classList.toggle('hidden');
    }

    function scrollToSection(sectionId) {
      document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    }

    async function init() {
      refreshRecords();
      applyConfig(defaultConfig);
      updateUI();
      renderAdminPanels();
      renderCalendar();
      changeAccessRole('user');
    }

    init();